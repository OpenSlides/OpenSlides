/**
 * OpenSlides Keycloak Theme - Dynamic Color Loader
 *
 * Fetches the organization's active theme from /system/presenter/theme
 * and applies colors as CSS custom properties.
 *
 * Palette generation algorithm ported from:
 *   openslides-client/client/src/app/site/services/color.service.ts
 */
(function () {
  "use strict";

  // --- Color utilities ---

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map(function (v) {
          var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
          return s.length === 1 ? "0" + s : s;
        })
        .join("")
    );
  }

  function mix(color1, color2, weight) {
    // Mixes two RGB colors. weight is 0-100 (percentage of color2).
    var w = weight / 100;
    return {
      r: color1.r + (color2.r - color1.r) * w,
      g: color1.g + (color2.g - color1.g) * w,
      b: color1.b + (color2.b - color1.b) * w,
    };
  }

  function multiply(rgb1, rgb2) {
    return {
      r: Math.floor((rgb1.r * rgb2.r) / 255),
      g: Math.floor((rgb1.g * rgb2.g) / 255),
      b: Math.floor((rgb1.b * rgb2.b) / 255),
    };
  }

  // Determine if a color is "light" (needs dark contrast text).
  // Uses the W3C perceived brightness formula.
  function isLight(rgb) {
    var brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
  }

  function saturate(rgb, amount) {
    // Simple saturation adjustment
    var max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
    var min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
    var l = (max + min) / 2;
    var d = max - min;
    var s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (d === 0) return rgb; // achromatic

    // Compute hue
    var h;
    var rn = rgb.r / 255,
      gn = rgb.g / 255,
      bn = rgb.b / 255;
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;

    s = Math.min(1, s + amount / 100);
    return hslToRgb(h, s, l);
  }

  function lighten(rgb, amount) {
    var max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
    var min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
    var l = (max + min) / 2;
    var d = max - min;
    var s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    var h;
    var rn = rgb.r / 255,
      gn = rgb.g / 255,
      bn = rgb.b / 255;
    if (d === 0) h = 0;
    else if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;

    l = Math.min(1, l + amount / 100);
    return hslToRgb(h, s, l);
  }

  function hslToRgb(h, s, l) {
    var r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  // --- Palette generation (matches color.service.ts) ---

  function generatePalette(hex500) {
    var baseColor = hexToRgb(hex500);
    var white = { r: 255, g: 255, b: 255 };
    var baseDark = multiply(baseColor, baseColor);

    var shades = [
      { name: "50", rgb: mix(white, baseColor, 12) },
      { name: "100", rgb: mix(white, baseColor, 30) },
      { name: "200", rgb: mix(white, baseColor, 50) },
      { name: "300", rgb: mix(white, baseColor, 70) },
      { name: "400", rgb: mix(white, baseColor, 85) },
      { name: "500", rgb: mix(white, baseColor, 100) },
      { name: "600", rgb: mix(baseDark, baseColor, 87) },
      { name: "700", rgb: mix(baseDark, baseColor, 70) },
      { name: "800", rgb: mix(baseDark, baseColor, 54) },
      { name: "900", rgb: mix(baseDark, baseColor, 25) },
      {
        name: "a100",
        rgb: lighten(saturate(mix(baseDark, baseDark, 15), 80), 65),
      },
      {
        name: "a200",
        rgb: lighten(saturate(mix(baseDark, baseDark, 15), 80), 55),
      },
      {
        name: "a400",
        rgb: lighten(saturate(mix(baseDark, baseDark, 15), 100), 45),
      },
      {
        name: "a700",
        rgb: lighten(saturate(mix(baseDark, baseDark, 15), 100), 40),
      },
    ];

    return shades.map(function (shade) {
      var hex = rgbToHex(shade.rgb.r, shade.rgb.g, shade.rgb.b);
      return {
        name: shade.name,
        hex: hex,
        darkContrast: isLight(shade.rgb),
      };
    });
  }

  // --- Apply theme to CSS custom properties ---

  function applyPalette(paletteName, shades) {
    var root = document.documentElement;
    shades.forEach(function (shade) {
      root.style.setProperty(
        "--theme-" + paletteName + "-" + shade.name,
        shade.hex
      );
      root.style.setProperty(
        "--theme-" + paletteName + "-" + shade.name + "-contrast",
        shade.darkContrast ? "rgba(0,0,0,0.87)" : "#ffffff"
      );
    });
  }

  function applyThemeColors(themeData) {
    var root = document.documentElement;
    var palettes = ["primary", "accent", "warn"];

    palettes.forEach(function (palette) {
      var hex500 = themeData[palette + "_500"];
      if (hex500) {
        // Generate full palette from the 500 shade
        var shades = generatePalette(hex500);
        applyPalette(palette, shades);

        // Override with any explicitly set shades from the theme
        shades.forEach(function (shade) {
          var key = palette + "_" + shade.name;
          if (themeData[key]) {
            root.style.setProperty(
              "--theme-" + palette + "-" + shade.name,
              themeData[key]
            );
            var rgb = hexToRgb(themeData[key]);
            root.style.setProperty(
              "--theme-" + palette + "-" + shade.name + "-contrast",
              isLight(rgb) ? "rgba(0,0,0,0.87)" : "#ffffff"
            );
          }
        });
      }
    });

    // Apply headbar color
    if (themeData.headbar) {
      root.style.setProperty("--theme-headbar", themeData.headbar);
    }
  }

  // --- Fetch theme from autoupdate endpoint ---

  function fetchTheme() {
    var controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeoutId;

    if (controller) {
      timeoutId = setTimeout(function () {
        controller.abort();
      }, 3000);
    }

    var fetchOptions = {};
    if (controller) {
      fetchOptions.signal = controller.signal;
    }

    fetch("/system/presenter/theme", fetchOptions)
      .then(function (response) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error("Theme endpoint returned " + response.status);
        }
        return response.json();
      })
      .then(function (themeData) {
        applyThemeColors(themeData);
      })
      .catch(function (err) {
        if (timeoutId) clearTimeout(timeoutId);
        console.warn("OpenSlides theme: using defaults.", err.message || err);
      });
  }

  // --- Initialize ---

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fetchTheme);
  } else {
    fetchTheme();
  }
})();
