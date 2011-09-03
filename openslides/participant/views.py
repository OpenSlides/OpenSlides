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
from django.http import HttpResponse
from django.shortcuts import redirect
from django.template import RequestContext
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import SetPasswordForm
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from participant.models import Profile, set_first_user_passwords
from participant.api import gen_username
from participant.forms import UserForm, UsernameForm, ProfileForm, UsersettingsForm, UserImportForm, GroupForm, AdminPasswordChangeForm
from utils.utils import template, permission_required, gen_confirm_form
from utils.pdf import print_userlist

from django.db.models import Avg, Max, Min, Count


@permission_required('participant.can_view_participants')
@template('participant/overview.html')
def get_overview(request):
    query = User.objects
    if 'gender' in request.GET and '---' not in request.GET['gender']:
        query = query.filter(profile__gender__iexact=request.GET['gender'])
    if 'group' in request.GET and '---' not in request.GET['group']:
        query = query.filter(profile__group__iexact=request.GET['group'])
    if 'type' in request.GET and '---' not in request.GET['type']:
        query = query.filter(profile__type__iexact=request.GET['type'])
    if 'committee' in request.GET and '---' not in request.GET['committee']:
        query = query.filter(profile__committee__iexact=request.GET['committee'])
    try:
        sort = request.GET['sort']
        if sort in ['first_name', 'last_name','username','last_login','email']:
            query = query.order_by(sort)
        elif sort in ['gender', 'group', 'type', 'committee']:
            query = query.order_by('profile__%s' % sort)
    except KeyError:
        pass
    if 'reverse' in request.GET:
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
    }

@permission_required('participant.can_manage_participants')
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
        userform = UserForm(request.POST, instance=user, prefix="user")
        try:
            profileform = ProfileForm(request.POST, instance=user.profile, prefix="profile")
        except:
            profileform = ProfileForm(request.POST, prefix="profile")

        formlist = [userform, profileform]
        formerror = 0
        for f in formlist:
            if not f.is_valid():
                formerror += 1
        if formerror == 0:
            user = userform.save()
            profile = profileform.save(commit=False)
            profile.user = user
            profile.save()
            if user_id is None:
                messages.success(request, _('New participant was successfully created.'))
            else:
                messages.success(request, _('Participant was successfully modified.'))
            return redirect(reverse('user_overview'))
        messages.error(request, _('Please check the form for errors.'))
    else:
        userform = UserForm(instance=user, prefix="user")
        try:
            profileform = ProfileForm(instance=user.profile, prefix="profile")
        except AttributeError:
            profileform = ProfileForm(prefix="profile")
    return {
        'userform': userform,
        'profileform': profileform,
        'edituser': user,
    }

@permission_required('participant.can_manage_participants')
@template('confirm.html')
def user_delete(request, user_id):
    user = User.objects.get(pk=user_id)
    if request.method == 'POST':
        user.delete()
        messages.success(request, _('Participant <b>%s</b> was successfully deleted.') % user)
    else:
        gen_confirm_form(request, _('Do you really want to delete <b>%s</b>?') % user, reverse('user_delete', args=[user_id]))
    return redirect(reverse('user_overview'))

@permission_required('participant.can_manage_participants')
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

@permission_required('participant.can_manage_participants')
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

@permission_required('participant.can_manage_participants')
@template('participant/group_overview.html')
def get_group_overview(request):
    groups = Group.objects.all()
    return {
        'groups': groups,
    }

@permission_required('participant.can_manage_participants')
@template('participant/group_edit.html')
def group_edit(request, group_id=None):
    if group_id is not None:
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            raise NameError("There is no Group %d" % group_id)
    else:
        group = None

    if request.method == 'POST':
        form = GroupForm(request.POST, instance=group)
        if form.is_valid():
            form.save()
            if group_id is None:
                messages.success(request, _('New group was successfully created.'))
            else:
                messages.success(request, _('Group was successfully modified.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
        return redirect(reverse('user_group_overview'))
    else:
        form = GroupForm(instance=group)
    return {
        'form': form,
        'group': group,
    }

@permission_required('participant.can_manage_participants')
def group_delete(request, group_id):
    group = Group.objects.get(pk=group_id)
    if request.method == 'POST':
        group.delete()
        messages.success(request, _('Group <b>%s</b> was successfully deleted.') % group)
    else:
        gen_confirm_form(request, 'Do you really want to delete <b>%s</b>?' % group, reverse('user_group_delete', args=[group_id]))
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

@permission_required('participant.can_manage_participants')
@template('participant/import.html')
def user_import(request):
    try:
        request.user.profile
        raise NameError("you can not use this function with a User, that has a Profile")
    except Profile.DoesNotExist:
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
                    (last_name, first_name, email, gender, group, type, committee) = line.strip().split(',')
                    user = User()
                    user.last_name = last_name
                    user.first_name = first_name
                    user.username = gen_username(first_name, last_name)
                    user.set_password("%s%s" % (user.first_name, user.last_name))
                    user.email = email
                    user.save()
                    profile = Profile()
                    profile.user = user
                    profile.gender = gender
                    profile.group = group
                    profile.type = type
                    profile.committee = committee
                    profile.save()
            messages.success(request, _('%d new participants were successfully imported.') % i)
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        messages.warning(request, _("Attention: All existing participants will be removed if you import new participants."))
        form = UserImportForm()
    return {
        'form': form,
    }


@permission_required('participant.can_manage_participants')
def gen_passwords(request):
    set_first_user_passwords()
    return redirect(reverse('user_overview'))


@permission_required('participant.can_manage_participants')
def reset_password(request, user_id):
    user = User.objects.get(pk=user_id)
    if request.method == 'POST':
        user.profile.reset_password()
        user.profile.save()
        messages.success(request, _('The Password for <b>%s</b> was successfully resettet') % user)
    else:
        gen_confirm_form(request, _('Do you really want to reset the password for <b>%s</b>') % user,
                         reverse('user_overview'))
    return redirect(reverse('user_edit', args=[user_id]))
