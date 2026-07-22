{pkgs}: {
  deps = [
    pkgs.chromium
    pkgs.libGL
    pkgs.libdrm
    pkgs.mesa
    pkgs.alsa-lib
    pkgs.libxkbcommon
    pkgs.expat
    pkgs.cups
    pkgs.cairo
    pkgs.pango
    pkgs.xorg.libXrandr
    pkgs.xorg.libXfixes
    pkgs.xorg.libXext
    pkgs.xorg.libXdamage
    pkgs.xorg.libXcomposite
    pkgs.xorg.libX11
    pkgs.dbus
    pkgs.at-spi2-atk
    pkgs.atk
    pkgs.nss
    pkgs.nspr
    pkgs.glib
  ];
}
