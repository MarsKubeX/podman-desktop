---
sidebar_position: 10
title: Configuring a managed user environment
description: Using managed configuration to enforce settings in enterprise environments.
tags: [podman-desktop, configuration, enterprise, managed]
keywords: [podman desktop, configuration, managed, enterprise, locked, admin, policy]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Configuring a managed user environment

In enterprise environments, administrators can enforce specific configuration values that users are unable to override. This capability allows them to manage configurations, such as proxy servers, telemetry policies, and security policies, ensuring users operate within a controlled environment. Administrators can review and edit the configurations in the user settings file before applying the changes globally to all enterprise users.

## How it works

Podman Desktop stores values for the following types of configuration in three separate JSON files:

1. **User configuration** - Editable user-enforced values for Podman Desktop customization.
2. **Managed defaults configuration** - Read-only administrator-enforced default values that cannot be edited by the user.
3. **Locked configuration** - Read-only administrator-enforced list of keys that must use managed values.

:::note[Linux: Multi-path configuration hierarchy]

On Linux, Podman Desktop follows the [UAPI Configuration Files Specification](https://uapi-group.org/specifications/specs/configuration_files_specification/) and reads managed configuration from two locations in precedence order:

1. `/etc/podman-desktop/` — Admin overrides (highest priority)
2. `/usr/share/podman-desktop/` — Managed defaults (lowest priority)

If both locations contain configuration files, values are merged with `/etc` taking precedence. This is particularly useful for **immutable/image-based Linux systems** (Fedora CoreOS, bootc, etc.) where `/usr/share` is read-only and administrators need to place overrides in `/etc`.

On macOS and Windows, a single managed path is used.

:::

### Default settings

On startup, Podman Desktop checks `default-settings.json` and applies any settings that don't already exist in the user's `settings.json`. This is a one-time copy per setting:

- Settings already in the user's `settings.json` are not overwritten
- Settings that match the built-in schema default are not copied (to avoid unnecessary entries)
- Only settings that differ from the schema default are persisted to `settings.json`

This allows administrators to pre-configure settings for new users while respecting existing user preferences.

### Locked settings

Settings listed in `locked.json` are enforced on every read and cannot be changed by the user:

- The value is always read from `default-settings.json`, ignoring the user's `settings.json`
- The setting displays a lock icon in the UI
- User changes to locked keys are ignored

Use locked settings when you need to enforce compliance, such as proxy servers or telemetry policies.

### Configuration priority

When a configuration changes, Podman Desktop returns a value after checking the user configuration files in the following priority order:

1. **Locked keys** - Return a value from the managed defaults configuration file, which is of highest priority
2. **Unlocked keys** - Return a value from the user configuration file
3. **Default value** - Returns the default value built into Podman Desktop

## File locations

<Tabs groupId="operating-systems">
<TabItem value="linux" label="Linux">

_User configuration_

- Location: `~/.local/share/containers/podman-desktop/configuration/settings.json`
- Permissions: User read/write
- Purpose: Normal user settings configured through the UI

_Managed defaults_

- Location: `/usr/share/podman-desktop/default-settings.json`
- Permissions: Root only
- Purpose: Default managed configuration values

_Managed defaults (admin override)_

- Location: `/etc/podman-desktop/default-settings.json`
- Permissions: Root only
- Purpose: Admin overrides that take precedence over managed defaults

_Locked configuration_

- Location: `/usr/share/podman-desktop/locked.json`
- Permissions: Root only
- Purpose: Default list of configuration keys that are locked

_Locked configuration (admin override)_

- Location: `/etc/podman-desktop/locked.json`
- Permissions: Root only
- Purpose: Admin override list of locked keys that take precedence over defaults

</TabItem>
<TabItem value="mac" label="macOS">

_User configuration_

- Location: `~/.local/share/containers/podman-desktop/configuration/settings.json`
- Permissions: User read/write
- Purpose: Normal user settings configured through the UI

_Managed defaults_

- Location: `/Library/Application Support/io.podman_desktop.PodmanDesktop/default-settings.json`
- Permissions: Administrator only
- Purpose: Administrator-enforced configuration values

_Locked configuration_

- Location: `/Library/Application Support/io.podman_desktop.PodmanDesktop/locked.json`
- Permissions: Administrator only
- Purpose: List of configuration keys that are locked by an administrator

</TabItem>
<TabItem value="win" label="Windows">

_User configuration_

- Location: `%USERPROFILE%\.local\share\containers\podman-desktop\configuration\settings.json`
- Permissions: User read/write
- Purpose: Normal user settings configured through the UI

_Managed defaults_

- Location: `%PROGRAMDATA%\Podman Desktop\default-settings.json`
- Permissions: Administrator only
- Purpose: Administrator-enforced configuration values

_Locked configuration_

- Location: `%PROGRAMDATA%\Podman Desktop\locked.json`
- Permissions: Administrator only
- Purpose: List of configuration keys that are locked by an administrator

</TabItem>
</Tabs>

## Example: Enforcing corporate proxy and telemetry settings

This example demonstrates how an administrator can lock the proxy and telemetry configuration to enforce corporate policy.

#### Procedure

1. Create a managed defaults file with corporate settings.
2. Create a locked configuration file to enforce the corporate settings.
3. Deploy both files to the appropriate system location.
4. Restart Podman Desktop, the managed values will override user-configured values and enforce compliance.

### User Configuration

The user has configured a local proxy in their settings:

```json title="~/.local/share/containers/podman-desktop/configuration/settings.json"
{
  "proxy.http": "https://127.0.0.1:8081",
  "telemetry.enabled": true
}
```

### Managed Defaults Configuration

The administrator creates a managed defaults file with corporate settings:

<Tabs groupId="operating-systems">
<TabItem value="linux" label="Linux">

```json title="/usr/share/podman-desktop/default-settings.json"
{
  "proxy.http": "http://corp-proxy.example.com:8080",
  "telemetry.enabled": false
}
```

</TabItem>
<TabItem value="mac" label="macOS">

```json title="/Library/Application Support/io.podman_desktop.PodmanDesktop/default-settings.json"
{
  "proxy.http": "http://corp-proxy.example.com:8080",
  "telemetry.enabled": false
}
```

</TabItem>
<TabItem value="win" label="Windows">

```json title="%PROGRAMDATA%\Podman Desktop\default-settings.json"
{
  "proxy.http": "http://corp-proxy.example.com:8080",
  "telemetry.enabled": false
}
```

</TabItem>
</Tabs>

### Locked Configuration

The administrator creates a locked configuration file to enforce these settings:

<Tabs groupId="operating-systems">
<TabItem value="linux" label="Linux">

```json title="/usr/share/podman-desktop/locked.json"
{
  "locked": ["proxy.http", "telemetry.enabled"]
}
```

</TabItem>
<TabItem value="mac" label="macOS">

```json title="/Library/Application Support/io.podman_desktop.PodmanDesktop/locked.json"
{
  "locked": ["proxy.http", "telemetry.enabled"]
}
```

</TabItem>
<TabItem value="win" label="Windows">

```json title="%PROGRAMDATA%\Podman Desktop\locked.json"
{
  "locked": ["proxy.http", "telemetry.enabled"]
}
```

</TabItem>
</Tabs>

### Result

With this configuration in place, Podman Desktop returns:

```json
{
  "proxy.http": "http://corp-proxy.example.com:8080",
  "telemetry.enabled": false
}
```

**Key observations:**

- `proxy.http` - Returns managed value, user's local proxy is ignored
- `telemetry.enabled` - Returns managed value, user cannot enable telemetry (set to false)

:::tip

As an administrator, you can implement several use cases to customize user settings based on your enterprise needs and apply those changes globally across your enterprise. For a comprehensive list of common use cases and examples, see [Managed configuration use cases](/docs/configuration/managed-configuration-use-cases).

:::

## Deploying a managed configuration

#### Procedure

<Tabs groupId="operating-systems">
<TabItem value="linux" label="Linux">

**Step 1: Create configuration files**

Podman Desktop reads managed configuration from two locations on Linux. Choose the appropriate path based on your deployment:

- `/usr/share/podman-desktop/` — Managed defaults (included in OS images or packages)
- `/etc/podman-desktop/` — Admin overrides (for site-specific or immutable system configurations)

If both locations contain configuration files, values from `/etc` take precedence over `/usr/share`.

_Managed defaults file:_

```json title="/usr/share/podman-desktop/default-settings.json"
{
  "proxy.http": "http://proxy.corp.example.com:8080",
  "telemetry.enabled": false
}
```

_Managed defaults file (admin override, optional):_

```json title="/etc/podman-desktop/default-settings.json"
{
  "proxy.http": "http://site-specific-proxy.example.com:3128"
}
```

_Locked configuration file:_

```json title="/usr/share/podman-desktop/locked.json"
{
  "locked": ["proxy.http", "telemetry.enabled"]
}
```

:::tip[Immutable Linux systems]

On image-based systems where `/usr/share` is read-only, place your configuration files in `/etc/podman-desktop/` instead. Podman Desktop will read from `/etc` even if `/usr/share/podman-desktop/` does not exist.

:::

**Step 2: Deploy using a deployment tool**

Choose a deployment tool: Ansible, Puppet, Chef, Salt, RPM/DEB packages, or shell scripts.

**Step 3: Verify the deployment**

1. Restart Podman Desktop.

2. Go to **Help > Troubleshooting**, and select the **Logs** tab to check for messages such as:

   ```
   [Managed-by]: Loaded managed defaults from: /usr/share/podman-desktop/default-settings.json
   [Managed-by]: Loaded managed defaults from: /etc/podman-desktop/default-settings.json
   [Managed-by]: Applied default settings for: proxy.http, telemetry.enabled
   ```

3. Verify that locked settings cannot be changed through the UI.

</TabItem>
<TabItem value="mac" label="macOS">

**Step 1: Create configuration files**

Save the following files at `/Library/Application Support/io.podman_desktop.PodmanDesktop/`:

_Managed defaults file:_

```json title="/Library/Application Support/io.podman_desktop.PodmanDesktop/default-settings.json"
{
  "proxy.http": "http://proxy.corp.example.com:8080",
  "telemetry.enabled": false
}
```

_Locked configuration file:_

```json title="/Library/Application Support/io.podman_desktop.PodmanDesktop/locked.json"
{
  "locked": ["proxy.http", "telemetry.enabled"]
}
```

**Step 2: Deploy using a deployment tool**

Choose a deployment tool: Jamf Pro, Microsoft Intune, Kandji, SimpleMDM, Ansible, or PKG installers.

**Step 3: Verify the deployment**

1. Restart Podman Desktop.

2. Go to **Help > Troubleshooting**, and select the **Logs** tab to check for messages such as:

   ```
   [Managed-by]: Loaded managed ...
   ```

3. Verify that locked settings cannot be changed through the UI.

</TabItem>
<TabItem value="win" label="Windows">

**Step 1: Create configuration files**

Save the following files at `%PROGRAMDATA%\Podman Desktop\`:

_Managed defaults file:_

```json title="%PROGRAMDATA%\Podman Desktop\default-settings.json"
{
  "proxy.http": "http://proxy.corp.example.com:8080",
  "telemetry.enabled": false
}
```

_Locked configuration file:_

```json title="%PROGRAMDATA%\Podman Desktop\locked.json"
{
  "locked": ["proxy.http", "telemetry.enabled"]
}
```

**Step 2: Deploy using a deployment tool**

Choose a deployment tool: Group Policy, Microsoft Intune, SCCM, Ansible, or PowerShell scripts.

**Step 3: Verify the deployment**

1. Restart Podman Desktop.

2. Go to **Help > Troubleshooting**, and select the **Logs** tab to check for messages such as:

   ```
   [Managed-by]: Loaded managed ...
   ```

3. Verify that locked settings cannot be changed through the UI.

</TabItem>
</Tabs>

## Locked configuration impact on users

When a setting is locked:

- **In the UI**: The setting appears grayed out or displays a lock icon
- **Editing settings.json**: Changes to locked keys in the user's file are ignored
- **Console output**: Log messages indicate when locked values are being used

:::note

Users are notified when settings are managed by administrators, ensuring transparency about which settings they can and cannot control.

:::

## Additional resources

- [Troubleshooting managed configuration](/docs/configuration/managed-configuration-troubleshooting)

- [Managed configuration use cases](/docs/configuration/managed-configuration-use-cases)
- [Configuration settings reference](/docs/configuration/settings-reference)
- [Configuration API Documentation](/api)
- [Extension Configuration Guide](/docs/extensions/developing/config)

## Next steps

- [Configure proxy settings](/docs/proxy)
- [Manage extensions](/docs/extensions)
