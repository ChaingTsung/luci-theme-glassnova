'use strict';
'require view';
'require form';
'require ui';

return view.extend({
  render: function() {
    var m = new form.Map('glassnova', _('GlassNova Theme'),
      _('Configure login background media, glass effect, light/dark mode and floating notifications.'));

    var s = m.section(form.NamedSection, 'main', 'theme', _('Appearance'));
    s.anonymous = true;

    var o = s.option(form.ListValue, 'mode', _('Theme mode'));
    o.value('auto', _('Follow browser'));
    o.value('light', _('Light'));
    o.value('dark', _('Dark'));
    o.default = 'auto';

    o = s.option(form.ListValue, 'provider', _('Login background provider'));
    o.value('local', _('Local media'));
    o.value('image', _('Remote image or GIF URL'));
    o.value('video', _('Remote video URL'));
    o.value('api', _('Generic JSON API'));
    o.value('unsplash', _('Unsplash image URL'));
    o.value('pixiv', _('Pixiv proxy API'));
    o.value('youtube', _('YouTube video ID'));
    o.value('twitter', _('X/Twitter proxy API'));
    o.value('selfhosted', _('Self-hosted API'));
    o.default = 'local';

    o = s.option(form.Value, 'local_url', _('Local media path'));
    o.placeholder = '/luci-static/glassnova/media/default.svg';
    o.description = _('Put files under /www/luci-static/glassnova/media/ and reference them with an absolute LuCI path. GIF, SVG, WebP, JPG, PNG, MP4 and WebM are supported.');
    o.depends('provider', 'local');

    o = s.option(form.Value, 'image_url', _('Remote image or GIF URL'));
    o.datatype = 'url';
    o.depends('provider', 'image');

    o = s.option(form.Value, 'video_url', _('Remote video URL'));
    o.datatype = 'url';
    o.description = _('Use direct MP4/WebM/HLS URLs. Browser and CORS restrictions still apply.');
    o.depends('provider', 'video');

    o = s.option(form.Value, 'api_url', _('Generic API URL'));
    o.datatype = 'url';
    o.description = _('The endpoint should return either a URL string or JSON like {"type":"image|video|youtube","url":"...","id":"...","poster":"..."}.');
    o.depends('provider', 'api');

    o = s.option(form.Value, 'unsplash_url', _('Unsplash source URL'));
    o.datatype = 'url';
    o.placeholder = 'https://source.unsplash.com/featured/1920x1080/?abstract,network,router';
    o.depends('provider', 'unsplash');

    o = s.option(form.Value, 'pixiv_api', _('Pixiv proxy API'));
    o.datatype = 'url';
    o.description = _('Do not expose Pixiv credentials in the browser. Use a proxy/self-hosted API that returns a safe media URL.');
    o.depends('provider', 'pixiv');

    o = s.option(form.Value, 'twitter_api', _('X/Twitter proxy API'));
    o.datatype = 'url';
    o.description = _('Use a proxy endpoint that returns a direct image/video URL. Direct X/Twitter media hotlinks may be blocked.');
    o.depends('provider', 'twitter');

    o = s.option(form.Value, 'selfhosted_api', _('Self-hosted API'));
    o.datatype = 'url';
    o.depends('provider', 'selfhosted');

    o = s.option(form.Value, 'youtube_id', _('YouTube video ID'));
    o.placeholder = 'dQw4w9WgXcQ';
    o.depends('provider', 'youtube');

    s = m.section(form.NamedSection, 'main', 'theme', _('Glass effect'));
    s.anonymous = true;

    o = s.option(form.Value, 'glass_alpha', _('Login form opacity'));
    o.placeholder = '0.56';
    o.datatype = 'range(0,1)';
    o.description = _('0.12 = very transparent, 0.95 = almost solid.');

    o = s.option(form.Value, 'glass_blur', _('Login form blur radius'));
    o.placeholder = '22';
    o.datatype = 'uinteger';
    o.description = _('Pixels. Example: 22');

    o = s.option(form.Value, 'title_alpha', _('Frosted title opacity'));
    o.placeholder = '0.42';
    o.datatype = 'range(0,1)';

    o = s.option(form.Flag, 'reduce_motion', _('Reduce motion'));
    o.default = o.disabled;

    s = m.section(form.NamedSection, 'main', 'theme', _('Preview helpers'));
    s.anonymous = true;

    o = s.option(form.Button, '_test_toast', _('Show test toast'));
    o.inputstyle = 'apply';
    o.onclick = function() {
      if (window.GlassNovaToast)
        window.GlassNovaToast(_('GlassNova floating notification preview'), 'success');
      else
        ui.addNotification(null, E('p', _('Toast bridge is not available on this page yet.')), 'info');
    };

    o = s.option(form.DummyValue, '_notes', _('Provider notes'));
    o.rawhtml = true;
    o.default = '<ul><li>Unsplash may require your own source/API URL depending on current service policy.</li><li>Pixiv and X/Twitter should be accessed through your own proxy API to avoid credential and CORS issues.</li><li>YouTube backgrounds use youtube-nocookie.com iframe embedding and are muted/looped.</li></ul>';

    return m.render();
  }
});
