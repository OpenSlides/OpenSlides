#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides projector api
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from mock import MagicMock, patch

from openslides.projector import api as projector_api
from openslides.utils.test import TestCase


class ApiFunctions(TestCase):
    @patch('openslides.projector.api.get_projector_content')
    @patch('openslides.projector.api.ProjectorSocketHandler')
    def test_update_projector(self, mock_ProjectorSocketHandler,
                              mock_get_projector_content):
        mock_get_projector_content.return_value = 'mock_string'
        projector_api.update_projector()
        mock_ProjectorSocketHandler.send_updates.assert_called_with(
            {'content': 'mock_string'})

    @patch('openslides.projector.api.get_overlays')
    @patch('openslides.projector.api.ProjectorSocketHandler')
    def test_update_projector_overlay(self, mock_ProjectorSocketHandler,
                                      mock_get_overlays):
        mock_overlay = MagicMock()
        mock_overlay.name = 'mock_overlay_name'
        mock_overlay.get_projector_html.return_value = 'mock_html_code'
        mock_overlay.get_javascript.return_value = 'mock_javascript'
        mock_get_overlays.return_value = {'mock_overlay': mock_overlay}

        # Test with active overlay
        mock_overlay.is_active.return_value = False
        projector_api.update_projector_overlay(None)
        mock_ProjectorSocketHandler.send_updates.assert_called_with(
            {'overlays': {'mock_overlay_name': None}})

        # Test with active overlay
        mock_overlay.is_active.return_value = True
        projector_api.update_projector_overlay(None)
        expected_data = {'overlays': {'mock_overlay_name': {
            'html': 'mock_html_code',
            'javascript': 'mock_javascript'}}}
        mock_ProjectorSocketHandler.send_updates.assert_called_with(expected_data)

        # Test with overlay name as argument
        projector_api.update_projector_overlay('mock_overlay')
        mock_ProjectorSocketHandler.send_updates.assert_called_with(expected_data)

        # Test with overlay object as argument
        projector_api.update_projector_overlay(mock_overlay)
        mock_ProjectorSocketHandler.send_updates.assert_called_with(expected_data)

    @patch('openslides.projector.api.config')
    @patch('openslides.projector.api.ProjectorSocketHandler')
    def test_call_on_projector(self, mock_ProjectorSocketHandler, mock_config):
        mock_config.__getitem__.return_value = {}
        data = {'some_call': 'argument'}
        projector_api.call_on_projector(data)
        mock_ProjectorSocketHandler.send_updates.assert_called_with(
            {'calls': data})
        mock_config.__getitem__.assert_called_with('projector_js_cache')
        mock_config.__setitem__.assert_called_with('projector_js_cache', data)

    @patch('openslides.projector.api.default_slide')
    def test_get_projector_content(self, mock_default_slide):
        mock_slide = MagicMock()
        mock_slide.return_value = 'slide content'

        with patch.dict('openslides.projector.api.slide_callback',
                        values={'mock_slide': mock_slide}):
            value = projector_api.get_projector_content({'callback': 'mock_slide'})
            self.assertEqual(value, 'slide content')

            projector_api.get_projector_content({'callback': 'unknown_slide'})
            self.assertTrue(mock_default_slide.called)

            with patch('openslides.projector.api.config',
                       {'projector_active_slide': {'callback': 'mock_slide'}}):
                value = projector_api.get_projector_content()
                self.assertEqual(value, 'slide content')

    @patch('openslides.projector.api.render_to_string')
    def test_default_slide(self, mock_render_to_string):
        projector_api.default_slide()
        mock_render_to_string.assert_called_with('projector/default_slide.html')

    @patch('openslides.projector.api.projector_overlays')
    def test_get_overlays(self, mock_projector_overlays):
        mock_overlay = MagicMock()
        mock_overlay.name = 'mock_overlay'
        mock_projector_overlays.send.return_value = ((None, mock_overlay), )

        value = projector_api.get_overlays()
        self.assertEqual(value, {'mock_overlay': mock_overlay})

    @patch('openslides.projector.api.render_to_string')
    @patch('openslides.projector.api.get_overlays')
    def test_get_projector_overlays(self, mock_get_overlays, mock_render_to_string):
        mock_overlay = MagicMock()
        mock_overlay.get_projector_html.return_value = 'some html'
        mock_get_overlays.return_value = {'overlay_name': mock_overlay}

        # Test with inactive overlay
        mock_overlay.is_active.return_value = False
        projector_api.get_projector_overlays()
        mock_render_to_string.assert_called_with(
            'projector/all_overlays.html',
            {'overlays': []})

        # Test with active overlay
        mock_overlay.is_active.return_value = True
        projector_api.get_projector_overlays()
        mock_render_to_string.assert_Called_with(
            'projector/all_overlays.html',
            {'overlays': [{'name': 'overlay_name', 'html': 'some html'}]})

    @patch('openslides.projector.api.get_overlays')
    def test_get_projector_overlays_js(self, mock_get_overlays):
        overlay = MagicMock()
        mock_get_overlays.return_value = {'overlay': overlay}

        # Test with inactive overlay
        overlay.is_active.return_value = False
        value = projector_api.get_projector_overlays_js()
        self.assertEqual(value, [])

        # Test with active overlay without js
        overlay.is_active.return_value = True
        overlay.get_javascript.return_value = None
        value = projector_api.get_projector_overlays_js()
        self.assertEqual(value, [])

        # Test with active overlay with js
        overlay.get_javascript.return_value = 'some javascript'
        value = projector_api.get_projector_overlays_js()
        self.assertEqual(value, ['some javascript'])

    def test_register_slide(self):
        mock_slide_callback = {}
        with patch('openslides.projector.api.slide_callback', mock_slide_callback):
            projector_api.register_slide('some name', 'some callback')
        self.assertEqual(mock_slide_callback, {'some name': 'some callback'})

    @patch('openslides.projector.api.render_to_string')
    @patch('openslides.projector.api.register_slide')
    def test_register_slide_model(self, mock_register_slide, mock_render_to_string):
        mock_SlideModel = MagicMock()
        mock_SlideModel.slide_callback_name = 'mock_callback_name'
        mock_SlideModel.DoesNotExist = Exception
        mock_slide_object = MagicMock()
        mock_slide_object.get_slide_context.return_value = 'some context'
        mock_SlideModel.objects.get.return_value = mock_slide_object

        projector_api.register_slide_model(mock_SlideModel, 'some template')
        used_args, __ = mock_register_slide.call_args
        self.assertEqual(used_args[0], 'mock_callback_name')

        # Test the generated slide function
        used_args[1](pk=1)
        mock_render_to_string.assert_called_with('some template', 'some context')

        # Test with non existing object
        mock_SlideModel.objects.get.side_effect = Exception
        used_args[1](pk=1)
        mock_render_to_string.assert_called_with('some template', {'slide': None})

    @patch('openslides.projector.api.update_projector_overlay')
    @patch('openslides.projector.api.update_projector')
    def test_set_active_slide(self, mock_update_projector, mock_update_projector_overlay):
        mock_config = {}
        with patch('openslides.projector.api.config', mock_config):
            projector_api.set_active_slide('callback_name', {'some': 'kwargs'})
        self.assertEqual(mock_config,
                         {'projector_active_slide': {'callback': 'callback_name',
                                                     'some': 'kwargs'}})
        mock_update_projector.assert_called_with()
        mock_update_projector_overlay.assert_called_with(None)

    def test_get_active_slide(self):
        mock_config = {'projector_active_slide': 'value'}
        with patch('openslides.projector.api.config', mock_config):
            value = projector_api.get_active_slide()
        self.assertEqual(value, 'value')
