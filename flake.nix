{
  description = "Discord Oracle Bot";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    devshell.url = "github:numtide/devshell";
  };

  outputs = { self, nixpkgs, flake-utils, devshell }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ devshell.overlays.default ];
        };
      in
      {
        devShells.default = pkgs.devshell.mkShell {
          name = "discord-oracle";

          packages = with pkgs; [
            deno
          ];

          commands = [
            {
              name = "register";
              help = "Register the /oracle command with Discord";
              command = "deno run --allow-net --allow-env --allow-read register_command.ts";
            }
          ];

          motd = ''
            {202}🔮 Discord Oracle Bot{reset}
            $(type -p menu &>/dev/null && menu)
          '';
        };
      }
    );
}
