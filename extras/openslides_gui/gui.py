from __future__ import unicode_literals

import datetime
import errno
import gettext
import itertools
import json
import locale
import os
import Queue
import subprocess
import sys
import threading

import openslides
import wx
from openslides.utils.main import (
    PortableDirNotWritable, detect_openslides_type, filesystem2unicode, get_default_user_data_path, get_port,
    unicode2filesystem)

# NOTE: djangos translation module can't be used here since it requires
#       a defined settings module
_translations = gettext.NullTranslations()
_ = lambda text: _translations.ugettext(text)
ungettext = lambda msg1, msg2, n: _translations.ungettext(msg1, msg2, n)


def get_data_path(*args):
    path = filesystem2unicode(__file__)
    return os.path.join(os.path.dirname(path), "data", *args)


class RunCmdEvent(wx.PyCommandEvent):
    def __init__(self, evt_type, evt_id):
        super(RunCmdEvent, self).__init__(evt_type, evt_id)

        self.running = False
        self.exitcode = None

EVT_RUN_CMD_ID = wx.NewEventType()
EVT_RUN_CMD = wx.PyEventBinder(EVT_RUN_CMD_ID, 1)


class RunCommandControl(wx.Panel):
    UPDATE_INTERVAL = 500

    def __init__(self, parent):
        super(RunCommandControl, self).__init__(parent)

        self.child_process = None
        self.output_queue = Queue.Queue()
        self.output_read_thread = None
        self.canceled = False
        self.output_mutex = threading.RLock()

        vbox = wx.BoxSizer(wx.VERTICAL)

        self.te_output = wx.TextCtrl(
            self, style=wx.TE_MULTILINE | wx.TE_READONLY | wx.HSCROLL)
        vbox.Add(self.te_output, 1, wx.EXPAND)

        self.update_timer = wx.Timer(self)
        self.Bind(wx.EVT_TIMER, self.on_update_timer, self.update_timer)

        self.SetSizerAndFit(vbox)

    def _read_output(self):
        while True:
            # NOTE: don't use iterator interface since it uses an
            # internal buffer and we don't see output in a timely fashion
            line = self.child_process.stdout.readline()
            if not line:
                break
            self.output_queue.put(line)

    def is_alive(self):
        if self.child_process is None:
            return False
        return self.child_process.poll() is None

    def run_command(self, *args):
        if self.is_alive():
            raise ValueError("already running a command")

        cmd = [sys.executable, "-u", "-m", "openslides"]
        cmd.extend(args)

        # XXX: subprocess on windows only handles byte strings
        #      with python3 this will hopefully no longer be the case
        cmd = [unicode2filesystem(x) for x in cmd]

        creationflags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
        self.child_process = subprocess.Popen(
            cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, creationflags=creationflags)
        self.child_process.stdin.close()
        self.output_read_thread = threading.Thread(target=self._read_output)
        self.output_read_thread.start()

        self.update_timer.Start(self.UPDATE_INTERVAL)

        evt = RunCmdEvent(EVT_RUN_CMD_ID, self.GetId())
        evt.running = True
        self.GetEventHandler().ProcessEvent(evt)

    def cancel_command(self):
        if not self.is_alive():
            return

        # TODO: try sigint first, then get more aggressive if user insists
        self.child_process.kill()
        self.canceled = True

    def on_update_timer(self, evt):
        is_alive = self.is_alive()
        if not is_alive:
            # join thread to make sure everything was read
            self.output_read_thread.join()
            self.output_read_thread = None

        for line_no in itertools.count():
            try:
                data = self.output_queue.get(block=False)
            except Queue.Empty:
                break
            else:
                # XXX: check whether django uses utf-8 or locale for
                #      it's cli output
                text = data.decode("utf-8", errors="replace")
                with self.output_mutex:
                    self.te_output.AppendText(text)

                # avoid waiting too long here if child is still alive
                if is_alive and line_no > 10:
                    break

        if not is_alive:
            exitcode = self.child_process.returncode
            self.update_timer.Stop()
            self.child_process = None

            evt = RunCmdEvent(EVT_RUN_CMD_ID, self.GetId())
            evt.running = False
            evt.exitcode = exitcode
            self.GetEventHandler().ProcessEvent(evt)

    def append_message(self, text, newline="\n"):
        with self.output_mutex:
            self.te_output.AppendText(text + newline)


class SettingsDialog(wx.Dialog):
    def __init__(self, parent):
        super(SettingsDialog, self).__init__(parent, wx.ID_ANY, _("Settings"))

        grid = wx.GridBagSizer(5, 5)
        row = 0

        lb_host = wx.StaticText(self, label=_("&Host:"))
        grid.Add(lb_host, pos=(row, 0))
        self.tc_host = wx.TextCtrl(self)
        grid.Add(self.tc_host, pos=(row, 1), flag=wx.EXPAND)

        row += 1

        lb_port = wx.StaticText(self, label=_("&Port:"))
        grid.Add(lb_port, pos=(row, 0))
        self.tc_port = wx.TextCtrl(self)
        grid.Add(self.tc_port, pos=(row, 1), flag=wx.EXPAND)

        row += 1

        sizer = self.CreateButtonSizer(wx.OK | wx.CANCEL)
        if not sizer is None:
            grid.Add((0, 0), pos=(row, 0), span=(1, 2))
            row += 1
            grid.Add(sizer, pos=(row, 0), span=(1, 2))

        box = wx.BoxSizer(wx.VERTICAL)
        box.Add(
            grid, flag=wx.EXPAND | wx.ALL | wx.ALIGN_CENTER_VERTICAL,
            border=5, proportion=1)

        self.SetSizerAndFit(box)

    @property
    def host(self):
        return self.tc_host.GetValue()

    @host.setter
    def host(self, host):
        self.tc_host.SetValue(host)

    @property
    def port(self):
        return self.tc_port.GetValue()

    @port.setter
    def port(self, port):
        self.tc_port.SetValue(port)


class BackupSettingsDialog(wx.Dialog):
    # NOTE: keep order in sync with _update_interval_choices()
    _INTERVAL_UNITS = ["second", "minute", "hour"]

    def __init__(self, parent):
        super(BackupSettingsDialog, self).__init__(
            parent, wx.ID_ANY, _("Database backup"))

        self._interval_units = {}

        grid = wx.GridBagSizer(5, 5)
        row = 0

        self.cb_backup = wx.CheckBox(
            self, label=_("&Regularly backup database"))
        self.cb_backup.SetValue(True)
        self.cb_backup.Bind(wx.EVT_CHECKBOX, self.on_backup_checked)
        grid.Add(self.cb_backup, pos=(row, 0), span=(1, 3))
        row += 1

        lb_dest = wx.StaticText(self, label=_("&Destination:"))
        grid.Add(lb_dest, pos=(row, 0))
        style = wx.FLP_SAVE | wx.FLP_USE_TEXTCTRL
        self.fp_dest = wx.FilePickerCtrl(self, style=style)
        grid.Add(self.fp_dest, pos=(row, 1), span=(1, 2), flag=wx.EXPAND)
        row += 1

        lb_interval = wx.StaticText(self, label=_("&Every"))
        grid.Add(lb_interval, pos=(row, 0))
        self.sb_interval = wx.SpinCtrl(self, min=1, initial=1)
        self.sb_interval.Bind(wx.EVT_SPINCTRL, self.on_interval_changed)
        grid.Add(self.sb_interval, pos=(row, 1))
        self.ch_interval_unit = wx.Choice(self)
        grid.Add(self.ch_interval_unit, pos=(row, 2))
        row += 1

        grid.AddGrowableCol(1)

        sizer = self.CreateButtonSizer(wx.OK | wx.CANCEL)
        if not sizer is None:
            grid.Add((0, 0), pos=(row, 0), span=(1, 3))
            row += 1
            grid.Add(sizer, pos=(row, 0), span=(1, 3))

        box = wx.BoxSizer(wx.VERTICAL)
        box.Add(
            grid, flag=wx.EXPAND | wx.ALL | wx.ALIGN_CENTER_VERTICAL,
            border=5, proportion=1)

        self.SetSizerAndFit(box)
        self._update_interval_choices()
        self._update_backup_enabled()

    @property
    def backupdb_enabled(self):
        return self.cb_backup.GetValue()

    @backupdb_enabled.setter
    def backupdb_enabled(self, enabled):
        self.cb_backup.SetValue(enabled)
        self._update_backup_enabled()

    @property
    def backupdb_destination(self):
        return self.fp_dest.GetPath()

    @backupdb_destination.setter
    def backupdb_destination(self, path):
        self.fp_dest.SetPath(path)

    @property
    def interval(self):
        return self.sb_interval.GetValue()

    @interval.setter
    def interval(self, value):
        self.sb_interval.SetValue(value)
        self._update_interval_choices()

    @property
    def interval_unit(self):
        return self._INTERVAL_UNITS[self.ch_interval_unit.GetSelection()]

    @interval_unit.setter
    def interval_unit(self, unit):
        try:
            idx = self._INTERVAL_UNITS.index(unit)
        except IndexError:
            raise ValueError("Unknown unit {0}".format(unit))

        self.ch_interval_unit.SetSelection(idx)

    def _update_interval_choices(self):
        count = self.sb_interval.GetValue()
        choices = [
            ungettext("second", "seconds", count),
            ungettext("minute", "minutes", count),
            ungettext("hour", "hours", count),
        ]

        current = self.ch_interval_unit.GetSelection()
        if current == wx.NOT_FOUND:
            current = 2  # default to hour

        self.ch_interval_unit.Clear()
        self.ch_interval_unit.AppendItems(choices)
        self.ch_interval_unit.SetSelection(current)

    def _update_backup_enabled(self):
        checked = self.cb_backup.IsChecked()
        self.fp_dest.Enable(checked)
        self.sb_interval.Enable(checked)
        self.ch_interval_unit.Enable(checked)

    def on_backup_checked(self, evt):
        self._update_backup_enabled()

    def on_interval_changed(self, evt):
        self._update_interval_choices()

    # TODO: validate settings on close (e.g. non-empty path if backup is
    #       enabled)


class MainWindow(wx.Frame):
    def __init__(self, parent=None):
        super(MainWindow, self).__init__(parent, title="OpenSlides")
        icons = wx.IconBundleFromFile(
            get_data_path("openslides.ico"),
            wx.BITMAP_TYPE_ICO)
        self.SetIcons(icons)

        self.server_running = False

        self.gui_settings_path = None
        self.gui_initialized = False

        self.backupdb_enabled = False
        self.backupdb_destination = ""
        self.backupdb_interval = 15
        self.backupdb_interval_unit = "minute"
        self.last_backup = None

        self.backup_timer = wx.Timer(self)
        self.Bind(wx.EVT_TIMER, self.on_backup_timer, self.backup_timer)

        spacing = 5

        panel = wx.Panel(self)
        grid = wx.GridBagSizer(spacing, spacing)

        # logo & about button
        logo_box = wx.BoxSizer(wx.HORIZONTAL)
        grid.Add(logo_box, pos=(0, 0), flag=wx.EXPAND)
        row = 0

        fp = get_data_path("openslides-logo_wide.png")
        with open(fp, "rb") as f:
            logo_wide_bmp = wx.ImageFromStream(f).ConvertToBitmap()

        logo_wide = wx.StaticBitmap(panel, wx.ID_ANY, logo_wide_bmp)
        logo_box.AddSpacer(2 * spacing)
        logo_box.Add(logo_wide)
        logo_box.AddStretchSpacer()

        version_str = _("Version {0}").format(openslides.get_version())
        lb_version = wx.StaticText(panel, label=version_str)
        font = lb_version.GetFont()
        font.SetPointSize(8)
        lb_version.SetFont(font)
        logo_box.Add(lb_version, flag=wx.ALIGN_CENTER_VERTICAL)

        self.bt_about = wx.Button(panel, label=_("&About..."))
        self.bt_about.Bind(wx.EVT_BUTTON, self.on_about_clicked)
        grid.Add(self.bt_about, pos=(row, 1), flag=wx.ALIGN_CENTER_VERTICAL)
        row += 1

        grid.Add((0, spacing), pos=(row, 0), span=(1, 2))
        row += 1

        # server settings
        server_settings = wx.StaticBox(panel, wx.ID_ANY, _("Server Settings"))
        server_box = wx.StaticBoxSizer(server_settings, wx.VERTICAL)
        grid.Add(server_box, pos=(row, 0), flag=wx.EXPAND)

        self._host = None
        self._port = None
        hbox = wx.BoxSizer(wx.HORIZONTAL)
        server_box.Add(hbox, flag=wx.EXPAND)
        self.lb_host = wx.StaticText(panel)
        hbox.Add(self.lb_host, flag=wx.ALIGN_CENTER_VERTICAL)
        hbox.AddStretchSpacer()
        self.lb_port = wx.StaticText(panel)
        hbox.Add(self.lb_port, flag=wx.ALIGN_CENTER_VERTICAL)
        hbox.AddStretchSpacer()
        self.bt_settings = wx.Button(panel, label=_("S&ettings..."))
        self.bt_settings.Bind(wx.EVT_BUTTON, self.on_settings_clicked)
        hbox.Add(self.bt_settings)

        server_box.AddSpacer(spacing)
        self.cb_start_browser = wx.CheckBox(
            panel, label=_("Automatically open &browser"))
        self.cb_start_browser.SetValue(True)
        server_box.Add(self.cb_start_browser)
        server_box.AddStretchSpacer()

        server_box.AddSpacer(spacing)
        self.bt_server = wx.Button(panel, label=_("&Start server"))
        self.bt_server.Bind(wx.EVT_BUTTON, self.on_start_server_clicked)
        server_box.Add(self.bt_server, flag=wx.EXPAND)

        self.host = "0.0.0.0"
        self.port = unicode(get_port(self.host, 80))

        # "action" buttons
        action_vbox = wx.BoxSizer(wx.VERTICAL)
        action_vbox.AddSpacer(3 * spacing)
        grid.Add(action_vbox, pos=(row, 1))
        self.bt_backup = wx.Button(panel, label=_("&Backup database..."))
        self.bt_backup.Bind(wx.EVT_BUTTON, self.on_backup_clicked)
        action_vbox.Add(self.bt_backup)
        action_vbox.AddSpacer(spacing)
        self.bt_sync_db = wx.Button(panel, label=_("S&ync database"))
        self.bt_sync_db.Bind(wx.EVT_BUTTON, self.on_syncdb_clicked)
        action_vbox.Add(self.bt_sync_db)
        action_vbox.AddSpacer(spacing)
        self.bt_reset_admin = wx.Button(panel, label=_("&Reset admin"))
        self.bt_reset_admin.Bind(wx.EVT_BUTTON, self.on_reset_admin_clicked)
        action_vbox.Add(self.bt_reset_admin)
        row += 1

        # command output
        self.cmd_run_ctrl = RunCommandControl(panel)
        self.cmd_run_ctrl.Bind(EVT_RUN_CMD, self.on_run_cmd_changed)
        grid.Add(
            self.cmd_run_ctrl,
            pos=(row, 0), span=(1, 2),
            flag=wx.EXPAND)

        grid.AddGrowableCol(0)
        grid.AddGrowableRow(3)

        box = wx.BoxSizer(wx.VERTICAL)
        box.Add(
            grid, flag=wx.EXPAND | wx.ALL | wx.ALIGN_CENTER_VERTICAL,
            border=spacing, proportion=1)
        panel.SetSizerAndFit(box)
        self.Fit()
        self.SetMinSize(self.ClientToWindowSize(box.GetMinSize()))
        self.SetInitialSize(wx.Size(500, 400))

        self.Bind(wx.EVT_CLOSE, self.on_close)

    def initialize_gui(self):
        if self.gui_initialized:
            return True

        # Set path for gui settings to default user data according to the
        # OpenSlides type. This does not depend on any argument the user might
        # type in.
        openslides_type = detect_openslides_type()
        try:
            default_user_data_path = get_default_user_data_path(openslides_type)
        except PortableDirNotWritable:
            wx.MessageBox(
                _("The portable directory is not writable. Please copy the "
                "openslides portable to a writeable location and start it "
                "again from there"),
                _("Error: Portable directory not writable"),
                wx.OK | wx.ICON_ERROR)
            return False

        self.gui_settings_path = os.path.join(
            default_user_data_path, 'openslides', 'gui_settings.json')
        self.load_gui_settings()
        self.apply_backup_settings()

        self.gui_initialized = True
        return True

    @property
    def backup_interval_seconds(self):
        if self.backupdb_interval_unit == "second":
            factor = 1
        elif self.backupdb_interval_unit == "minute":
            factor = 60
        elif self.backupdb_interval_unit == "hour":
            factor = 3600

        return self.backupdb_interval * factor

    @property
    def host(self):
        return self._host

    @host.setter
    def host(self, host):
        self._host = host
        self.lb_host.SetLabel(_("Host: {0}").format(host))

    @property
    def port(self):
        return self._port

    @port.setter
    def port(self, port):
        self._port = port
        self.lb_port.SetLabel(_("Port: {0}").format(port))

    def load_gui_settings(self):
        if self.gui_settings_path is None:
            return

        try:
            f = open(self.gui_settings_path, "rb")
        except IOError as e:
            if e.errno == errno.ENOENT:
                return
            raise

        with f:
            settings = json.load(f)

        def setattr_unless_none(attr, value):
            if not value is None:
                setattr(self, attr, value)

        backup_settings = settings.get("database_backup", {})
        setattr_unless_none("backupdb_enabled", backup_settings.get("enabled"))
        setattr_unless_none(
            "backupdb_destination", backup_settings.get("destination"))
        setattr_unless_none(
            "backupdb_interval", backup_settings.get("interval"))
        setattr_unless_none(
            "backupdb_interval_unit", backup_settings.get("interval_unit"))
        last_backup = backup_settings.get("last_backup")
        if not last_backup is None:
            self.last_backup = datetime.datetime.strptime(
                last_backup, "%Y-%m-%d %H:%M:%S")
        server_settings = settings.get("server_settings", {})
        setattr_unless_none("host", server_settings.get("host"))
        setattr_unless_none("port", server_settings.get("port"))

    def save_gui_settings(self):
        if self.last_backup is None:
            last_backup = None
        else:
            last_backup = self.last_backup.strftime("%Y-%m-%d %H:%M:%S")
        settings = {
            "database_backup": {
                "enabled": self.backupdb_enabled,
                "destination": self.backupdb_destination,
                "internal": self.backupdb_interval,
                "interval_unit": self.backupdb_interval_unit,
                "last_backup": last_backup
            },
            "server_settings": {
                "host": self.host,
                "port": self.port,
            },
        }

        dp = os.path.dirname(self.gui_settings_path)
        if not os.path.exists(dp):
            os.makedirs(dp)
        with open(self.gui_settings_path, "wb") as f:
            json.dump(settings, f, ensure_ascii=False, indent=4)

    def apply_backup_settings(self):
        if self.backupdb_enabled and self.server_running:
            now = datetime.datetime.utcnow()
            delta = datetime.timedelta(seconds=self.backup_interval_seconds)
            ref = self.last_backup
            if ref is None:
                ref = now
            ref += delta

            d = ref - now
            seconds = d.days * 86400 + d.seconds
            if seconds < 1:
                seconds = 30  # avoid backup immediatly after start
            self.backup_timer.Start(seconds * 1000, True)
        else:
            self.backup_timer.Stop()

    def do_backup(self):
        cmd = [
            sys.executable, "-u", "-m", "openslides", "backupdb",
            self.backupdb_destination,
        ]
        p = subprocess.Popen(
            cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT)
        p.stdin.close()
        output = p.stdout.read().strip()
        exitcode = p.wait()
        if output:
            self.cmd_run_ctrl.append_message(output)

        time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if exitcode == 0:
            self.cmd_run_ctrl.append_message(
                _("{0}: Database backup successful.").format(time))
        else:
            self.cmd_run_ctrl.append_message(
                _("{0}: Database backup failed!").format(time))

        self.last_backup = datetime.datetime.utcnow()

    def on_syncdb_clicked(self, evt):
        self.cmd_run_ctrl.append_message(_("Syncing database..."))
        self.cmd_run_ctrl.run_command("syncdb")

    def on_reset_admin_clicked(self, evt):
        self.cmd_run_ctrl.append_message(_("Resetting admin user..."))
        self.cmd_run_ctrl.run_command("createsuperuser")

    def on_about_clicked(self, evt):
        info = wx.AboutDialogInfo()
        info.SetName("OpenSlides")
        info.SetVersion(openslides.get_version())
        info.SetDescription(_(
            "OpenSlides is a free web based presentation and "
            "assembly system.\n"
            "OpenSlides is free software; licensed under the MIT license."
        ).replace(u" ", u"\u00a0"))
        info.SetCopyright(_(u"\u00a9 2011-2014 by OpenSlides team"))
        info.SetWebSite(("http://www.openslides.org/", "www.openslides.org"))

        # XXX: at least on wxgtk this has no effect
        info.SetIcon(self.GetIcon())
        wx.AboutBox(info)

    def on_start_server_clicked(self, evt):
        if self.server_running:
            self.cmd_run_ctrl.cancel_command()
            return

        if self._host == "0.0.0.0":
            args = ["--port", self._port]
        else:
            args = ["--address", self._host, "--port", self._port]

        if not self.cb_start_browser.GetValue():
            args.append("--no-browser")

        self.server_running = True
        self.cmd_run_ctrl.run_command("start", *args)

        # initiate backup_timer if backup is enabled
        self.apply_backup_settings()

        self.bt_server.SetLabel(_("&Stop server"))

    def on_settings_clicked(self, evt):
        dlg = SettingsDialog(self)
        dlg.host = self._host
        dlg.port = self._port

        if dlg.ShowModal() == wx.ID_OK:
            self.host = dlg.host
            self.port = dlg.port

    def on_backup_clicked(self, evt):
        dlg = BackupSettingsDialog(self)
        dlg.backupdb_enabled = self.backupdb_enabled
        dlg.backupdb_destination = self.backupdb_destination
        dlg.interval = self.backupdb_interval
        dlg.interval_unit = self.backupdb_interval_unit
        if dlg.ShowModal() == wx.ID_OK:
            self.backupdb_enabled = dlg.backupdb_enabled
            self.backupdb_destination = dlg.backupdb_destination
            self.backupdb_interval = dlg.interval
            self.backupdb_interval_unit = dlg.interval_unit
            self.apply_backup_settings()

    def on_run_cmd_changed(self, evt):
        show_completion_msg = not evt.running
        if self.server_running and not evt.running:
            self.bt_server.SetLabel(_("&Start server"))
            self.server_running = False

            self.backup_timer.Stop()
            if self.backupdb_enabled:
                self.do_backup()

            # no operation completed msg when stopping server
            show_completion_msg = False

        self.bt_settings.Enable(not evt.running)
        self.bt_backup.Enable(not evt.running)
        self.bt_sync_db.Enable(not evt.running)
        self.bt_reset_admin.Enable(not evt.running)
        self.bt_server.Enable(self.server_running or not evt.running)

        if show_completion_msg:
            if evt.exitcode == 0:
                text = _("Operation successfully completed.")
            else:
                text = _("Operation failed (exit code = {0})").format(
                    evt.exitcode)
            self.cmd_run_ctrl.append_message(text)

    def on_backup_timer(self, evt):
        if not self.backupdb_enabled:
            return

        self.do_backup()
        self.backup_timer.Start(1000 * self.backup_interval_seconds, True)

    def on_close(self, ev):
        self.cmd_run_ctrl.cancel_command()
        self.save_gui_settings()
        self.Destroy()

class OpenslidesApp(wx.App):
    def __init__(self):
        super(OpenslidesApp, self).__init__(False)

    def OnInit(self):
        window = MainWindow()
        self.SetTopWindow(window)

        if not window.initialize_gui():
            self.Exit()
            return False

        window.Show()
        return True

def main():
    locale.setlocale(locale.LC_ALL, "")
    lang = locale.getdefaultlocale()[0]
    if lang:
        global _translations
        localedir = filesystem2unicode(openslides.__file__)
        localedir = os.path.dirname(localedir)
        localedir = os.path.join(localedir, "locale")
        _translations = gettext.translation(
            "django", localedir, [lang], fallback=True)

    app = OpenslidesApp()
    app.MainLoop()

if __name__ == "__main__":
    main()
