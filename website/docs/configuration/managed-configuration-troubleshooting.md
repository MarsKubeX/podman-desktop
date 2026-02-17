---
sidebar_position: 12
title: Troubleshooting managed configurations
description: Common issues and solutions for managed configuration in enterprise environments.
tags: [podman-desktop, configuration, enterprise, managed, troubleshooting]
keywords: [podman desktop, configuration, managed, enterprise, troubleshooting, issues, problems]
---

# Troubleshooting managed configuration

When implementing managed configuration in an enterprise environment, you may encounter some common issues often caused by file location, permissions, or syntax errors.

## Locked configuration not working

If your locked configuration is not being applied, try the following solutions:

1. Verify file locations are correct for your operating system.
2. Check file permissions (files must be owned by root/administrator).
3. Ensure JSON syntax is valid (use a JSON validator).
4. Restart Podman Desktop after creating configuration files.

## Settings not being enforced

If settings appear to be locked but values are not being enforced correctly:

1. Check that the key name in `locked.json` exactly matches the key in `default-settings.json`.
2. Verify the configuration key uses dot notation (e.g., `proxy.http`, not `proxy: { http: ... }`).
3. Check console output for error messages.

## Verifying configuration is loaded

To verify that your managed configuration is being loaded correctly:

1. Open Podman Desktop.
2. Go to **Help > Troubleshooting**, and select the **Logs** tab to check for messages such as:
3. Look for messages in the console like:
   ```
   [Managed-by]: Loaded managed ...
   [Managed-by]: Applied default settings for: setting.key1, setting.key2
   ```
4. If you don't see these messages, the configuration files may not be in the correct location or may have syntax errors.

:::note

The "Applied default settings" message only appears when settings are copied from `default-settings.json` to the user's `settings.json`. This occurs once per setting when it doesn't already exist in the user's configuration.

:::

## Verifying if a value is locked by the managed-by configuration

To verify in the GUI if a value is locked by your managed-by configuration:

1. Open Podman Desktop.
2. Go to **Settings > Preferences**.
3. Find your managed-by value:

![Managed by label](img/managed-by-label.png)

4. Confirm that it has the **Managed** label applied.

## Configuration from `/etc` not overriding `/usr/share` (Linux)

On Linux, Podman Desktop reads managed configuration from two locations: `/usr/share/podman-desktop/` (managed defaults) and `/etc/podman-desktop/` (admin overrides). If your `/etc` overrides are not taking effect:

1. Verify the file names are exactly `default-settings.json` and `locked.json` (same as in `/usr/share`).
2. Ensure the JSON content is valid (use a JSON validator).
3. Check the startup logs. You should see separate log entries for each location:
   ```
   [Managed-by]: Loaded managed defaults from: /usr/share/podman-desktop/default-settings.json
   [Managed-by]: Loaded managed defaults from: /etc/podman-desktop/default-settings.json
   ```
4. If you only see one log entry, the other file is missing or has a syntax error.
5. Remember that `/etc` values only override keys that are present in the `/etc` file. Keys not listed in the `/etc` file will keep their `/usr/share` values.

## Managed defaults not applied after restart

If the log message `Applied default settings for: ...` does not appear after a restart:

1. The settings may already exist in the user's `settings.json`. Managed defaults are only applied once per setting, when the key does not yet exist in the user's configuration.
2. Check the user's `settings.json` file at `~/.local/share/containers/podman-desktop/configuration/settings.json` or `~/.config/containers/podman-desktop/settings.json`.
3. To re-apply managed defaults, remove the specific key from the user's `settings.json` and restart Podman Desktop.

## File permission issues

On Linux and macOS, managed configuration files must have appropriate permissions:

- Files must be owned by root/administrator
- Files should be readable by all users but writable only by root/administrator
- Use `chmod 644` for the configuration files on Linux/macOS

## Additional resources

- [Configuring a managed user environment](/docs/configuration/managed-configuration)
- [Managed configuration use cases](/docs/configuration/managed-configuration-use-cases)
- [Configuration settings reference](/docs/configuration/settings-reference)
