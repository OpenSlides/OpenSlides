#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the participant app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import csv
from urllib import urlencode
try:
    from urlparse import parse_qs
except ImportError: # old python version, grab it from cgi
    from cgi import parse_qs

from django.http import HttpResponse
from django.shortcuts import redirect
from django.template import RequestContext
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import SetPasswordForm
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _, ungettext

from participant.models import Profile
from participant.api import gen_username, gen_password
from participant.forms import UserNewForm, UserEditForm, ProfileForm, UsersettingsForm, UserImportForm, GroupForm, AdminPasswordChangeForm
from utils.utils import template, permission_required, gen_confirm_form
from utils.pdf import print_userlist, print_passwords
from system.api import config_get

from django.db.models import Avg, Max, Min, Count


@permission_required('participant.can_see_participant')
@template('participant/overview.html')
def get_overview(request):
    def decodedict(dict):
        newdict = {}
        for key in dict:
            newdict[key] = [dict[key][0].encode('utf-8')]
        return newdict

    def encodedict(dict):
        newdict = {}
        for key in dict:
            newdict[key] = [unicode(dict[key][0].decode('utf-8'))]
        return newdict
    try:
        sortfilter = encodedict(parse_qs(request.COOKIES['participant_sortfilter']))
    except KeyError:
        sortfilter = {}

    for value in [u'gender', u'group', u'type', u'committee', u'sort', u'reverse']:
        if value in request.REQUEST:
            if request.REQUEST[value] == '---':
                try:
                    del sortfilter[value]
                except KeyError:
                    pass
            else:
                sortfilter[value] = [request.REQUEST[value]]

    query = User.objects
    if 'gender' in sortfilter:
        query = query.filter(profile__gender__iexact=sortfilter['gender'][0])
    if 'group' in sortfilter:
        query = query.filter(profile__group__iexact=sortfilter['group'][0])
    if 'type' in sortfilter:
        query = query.filter(profile__type__iexact=sortfilter['type'][0])
    if 'committee' in sortfilter:
        query = query.filter(profile__committee__iexact=sortfilter['committee'][0])
    if 'sort' in sortfilter:
        if sortfilter['sort'][0] in ['first_name', 'last_name','username','last_login','email']:
            query = query.order_by(sortfilter['sort'][0])
        elif sortfilter['sort'][0] in ['group', 'type', 'committee']:
            query = query.order_by('profile__%s' % sortfilter['sort'][0])
    else:
        query = query.order_by('first_name')
    if 'reverse' in sortfilter:
        query = query.reverse()

    userlist = query.all()
    users = []
    for user in userlist:
        try:
            user.get_profile()
            users.append(user)
        except Profile.DoesNotExist:
            pass
    groups = [p['group'] for p in Profile.objects.values('group').exclude(group='').distinct()]
    committees = [p['committee'] for p in Profile.objects.values('committee').exclude(committee='').distinct()]
    return {
        'users': users,
        'groups': groups,
        'committees': committees,
        'cookie': ['participant_sortfilter', urlencode(decodedict(sortfilter), doseq=True)],
        'sortfilter': sortfilter,
    }

@permission_required('participant.can_manage_participant')
@template('participant/edit.html')
def edit(request, user_id=None):
    """
    View zum editieren und neuanlegen von Usern mit Profile
    """
    if user_id is not None:
        user = User.objects.get(id=user_id)
    else:
        user = None

    if request.method == 'POST':
        if user_id is None:
            userform = UserNewForm(request.POST, prefix="user")
            profileform = ProfileForm(request.POST, prefix="profile")
        else:
            userform = UserEditForm(request.POST, instance=user, prefix="user")
            profileform = ProfileForm(request.POST, instance=user.profile, prefix="profile")

        if userform.is_valid and profileform.is_valid:
            user = userform.save()
            if user_id is None:
                user.username = gen_username(user.first_name, user.last_name)
                user.save()
            profile = profileform.save(commit=False)
            profile.user = user
            profile.firstpassword = gen_password()
            profile.user.set_password(profile.firstpassword)
            user.save()
            profile.save()
            if user_id is None:
                messages.success(request, _('New participant was successfully created.'))
            else:
                messages.success(request, _('Participant was successfully modified.'))
            if not 'apply' in request.POST:
                return redirect(reverse('user_overview'))
            if user_id is None:
                return redirect(reverse('user_edit', args=[user.id]))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        if user_id is None:
            userform = UserNewForm(prefix="user")
            profileform = ProfileForm(prefix="profile")
        else:
            userform = UserEditForm(instance=user, prefix="user")
            profileform = ProfileForm(instance=user.profile, prefix="profile")

    return {
        'userform': userform,
        'profileform': profileform,
        'edituser': user,
    }

@permission_required('participant.can_manage_participant')
@template('confirm.html')
def user_delete(request, user_id):
    user = User.objects.get(pk=user_id)
    if request.method == 'POST':
        user.delete()
        messages.success(request, _('Participant <b>%s</b> was successfully deleted.') % user)
    else:
        gen_confirm_form(request, _('Do you really want to delete <b>%s</b>?') % user, reverse('user_delete', args=[user_id]))
    return redirect(reverse('user_overview'))

@permission_required('participant.can_manage_participant')
@template('confirm.html')
def user_set_superuser(request, user_id):
    user = User.objects.get(pk=user_id)
    if user.is_superuser:
        user.is_superuser = False
        user.save()
        messages.success(request, _('Participant <b>%s</b> is now a normal user.') % user)
    else:
        user.is_superuser = True
        user.save()
        messages.success(request, _('Participant <b>%s</b> is now administrator.') % user)
    return redirect(reverse('user_overview'))

@permission_required('participant.can_manage_participant')
@template('confirm.html')
def user_set_active(request, user_id):
    user = User.objects.get(pk=user_id)
    if user.is_active:
        user.is_active = False
        user.save()
        messages.success(request, _('Participant <b>%s</b> was successfully deactivated.') % user)
    else:
        user.is_active = True
        user.save()
        messages.success(request, _('Participant <b>%s</b> was successfully activated.') % user)
    return redirect(reverse('user_overview'))

@permission_required('participant.can_manage_participant')
@template('participant/group_overview.html')
def get_group_overview(request):
    if config_get('system_enable_anonymous', False):
        groups = Group.objects.all()
    else:
        groups = Group.objects.exclude(name='Anonymous')
    return {
        'groups': groups,
    }

@permission_required('participant.can_manage_participant')
@template('participant/group_edit.html')
def group_edit(request, group_id=None):
    if group_id is not None:
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            raise NameError("There is no group %d" % group_id)
    else:
        group = None

    if request.method == 'POST':
        form = GroupForm(request.POST, instance=group)
        if form.is_valid():
            group_name = form.cleaned_data['name'].lower()

            try:
                anonymous_group = Group.objects.get(name='Anonymous')
            except Group.DoesNotExist:
                anonymous_group = None

            # special handling for anonymous auth
            if group is None and group_name.strip().lower() == 'anonymous':
                # don't allow to create this group
                messages.error(request, _('Group name "%s" is reserved for internal use.') % group_name)
                return {
                    'form' : form,
                    'group': group
                }

            group = form.save()
            if anonymous_group is not None and \
               anonymous_group.id == group.id:
                # prevent name changes - XXX: I'm sure this could be done as *one* group.save()
                group.name = 'Anonymous'
                group.save()

            if group_id is None:
                messages.success(request, _('New group was successfully created.'))
            else:
                messages.success(request, _('Group was successfully modified.'))
            if not 'apply' in request.POST:
                return redirect(reverse('user_group_overview'))
            if group_id is None:
                return redirect(reverse('user_group_edit', args=[group.id]))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form = GroupForm(instance=group)
    return {
        'form': form,
        'group': group,
    }

@permission_required('participant.can_manage_participant')
def group_delete(request, group_id):
    group = Group.objects.get(pk=group_id)
    if request.method == 'POST':
        group.delete()
        messages.success(request, _('Group <b>%s</b> was successfully deleted.') % group)
    else:
        gen_confirm_form(request, _('Do you really want to delete <b>%s</b>?') % group, reverse('user_group_delete', args=[group_id]))
    return redirect(reverse('user_group_overview'))

@login_required
@template('participant/settings.html')
def user_settings(request):
    if request.method == 'POST':
        form_user = UsersettingsForm(request.POST,instance=request.user, prefix='user')
        form_password = SetPasswordForm(request.user,request.POST,prefix='password')
        if form_user.is_valid() and form_password.is_valid():
            form_user.save()
            form_password.save()
            messages.success(request, _('User settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form_user = UsersettingsForm(instance=request.user, prefix='user')
        form_password = SetPasswordForm(request.user,prefix='password')

    return {
        'form_user': form_user,
        'form_password': form_password,
        'edituser': request.user,
    }

@permission_required('participant.can_manage_participant')
@template('participant/import.html')
def user_import(request):
    try:
        request.user.profile
        messages.error(request, _('The import function is available for the superuser (without user profile) only.'))
        return redirect(reverse('user_overview'))
    except Profile.DoesNotExist:
        pass
    except AttributeError:
        # AnonymousUser
        pass

    if request.method == 'POST':
        form = UserImportForm(request.POST, request.FILES)
        if form.is_valid():
            profiles = Profile.objects.all()
            for profile in profiles:
                profile.user.delete()
                profile.delete()
            i = -1
            for line in request.FILES['csvfile']:
                i += 1
                if i > 0:
                    (first_name, last_name, gender, group, type, committee) = line.strip().split(',')
                    user = User()
                    user.last_name = last_name
                    user.first_name = first_name
                    user.username = gen_username(first_name, last_name)
                    #user.email = email
                    user.save()
                    profile = Profile()
                    profile.user = user
                    profile.gender = gender
                    profile.group = group
                    profile.type = type
                    profile.committee = committee
                    profile.firstpassword = gen_password()
                    profile.user.set_password(profile.firstpassword)
                    profile.save()

                    if type == 'delegate':
                        delegate = Group.objects.get(name='Delegierte')
                        user.groups.add(delegate)
                    else:
                        observer = Group.objects.get(name='Beobachter')
                        user.groups.add(observer)

            messages.success(request, _('%d new participants were successfully imported.') % i)
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        messages.warning(request, _("Attention: All existing participants will be removed if you import new participants."))
        form = UserImportForm()
    return {
        'form': form,
    }


@permission_required('participant.can_manage_participant')
def reset_password(request, user_id):
    user = User.objects.get(pk=user_id)
    if request.method == 'POST':
        user.profile.reset_password()
        messages.success(request, _('The Password for <b>%s</b> was successfully reset.') % user)
    else:
        gen_confirm_form(request, _('Do you really want to reset the password for <b>%s</b>?') % user,
                         reverse('user_reset_password', args=[user_id]))
    return redirect(reverse('user_edit', args=[user_id]))
