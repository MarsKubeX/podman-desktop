---
sidebar_position: 11
title: Managed configuration use cases
description: Common use cases and examples for enterprise managed configuration.
tags: [podman-desktop, configuration, enterprise, managed, use-cases]
keywords: [podman desktop, configuration, managed, enterprise, examples, use cases]
---

# Managed configuration use cases

As an administrator, you can use managed configuration to enforce specific settings for all users in your organization. Below are some common use cases with example configurations.

## Enforcing proxy settings

Lock proxy configuration to ensure all users route traffic through corporate proxy servers.

```json title="default-settings.json"
{
  "proxy.http": "http://corp-proxy.example.com:8080"
}
```

```json title="locked.json"
{
  "locked": ["proxy.http"]
}
```

## Managing telemetry

Control telemetry settings for compliance or privacy requirements.

```json title="default-settings.json"
{
  "telemetry.enabled": false
}
```

```json title="locked.json"
{
  "locked": ["telemetry.enabled"]
}
```

## Configuring default registries and mirrors

Configure default container registries with optional mirrors for your organization. This is useful for directing image pulls through internal registry mirrors or blocking access to specific registries.

Each entry in the `registries.defaults` array can be either a registry definition or a mirror. Mirrors must follow immediately after the registry they belong to.

:::note
This configuration maps to the [registries.conf](https://github.com/containers/image/blob/main/docs/containers-registries.conf.5.md) format used by Podman. For advanced configuration options and detailed documentation, refer to the [upstream specification](https://github.com/containers/image/blob/main/docs/containers-registries.conf.5.md#example) on how to setup your `registries.conf` and how Podman Desktop reads/writes to it.
:::

### Registry properties

| Property   | Type    | Required | Description                                    |
| ---------- | ------- | -------- | ---------------------------------------------- |
| `prefix`   | string  | Yes      | The registry prefix to match (e.g., `quay.io`) |
| `location` | string  | Yes      | The registry URL or location                   |
| `insecure` | boolean | No       | Allow insecure connections (default: `false`)  |
| `blocked`  | boolean | No       | Block pulls (default: `false`)                 |

### Mirror properties

| Property   | Type    | Required | Description                                   |
| ---------- | ------- | -------- | --------------------------------------------- |
| `location` | string  | Yes      | The mirror URL                                |
| `insecure` | boolean | No       | Allow insecure connections (default: `false`) |

### Example: Configure a registry with a mirror

```json title="default-settings.json"
{
  "registries.defaults": [
    {
      "registry": {
        "prefix": "quay.io",
        "location": "quay.io"
      }
    },
    {
      "registry.mirror": {
        "location": "mirror.example.com"
      }
    }
  ]
}
```

### Example: Block a registry

```json title="default-settings.json"
{
  "registries.defaults": [
    {
      "registry": {
        "prefix": "untrusted.example.com",
        "location": "untrusted.example.com",
        "blocked": true
      }
    }
  ]
}
```

## Deploying on immutable Linux systems

On image-based Linux systems, the `/usr/share` directory is read-only and cannot be modified after the image is built. Podman Desktop supports an alternative configuration path at `/etc/podman-desktop/` for these environments.

### Managed defaults baked into the OS image

If you build custom OS images, include managed defaults in the image:

```json title="/usr/share/podman-desktop/default-settings.json"
{
  "proxy.http": "http://default-proxy.example.com:8080",
  "telemetry.enabled": false
}
```

### Admin overrides applied at deployment time

After the image is deployed, administrators can add site-specific overrides in `/etc/podman-desktop/`. Values in `/etc` take precedence over `/usr/share`:

```json title="/etc/podman-desktop/default-settings.json"
{
  "proxy.http": "http://site-specific-proxy.example.com:3128"
}
```

```json title="/etc/podman-desktop/locked.json"
{
  "locked": ["proxy.http", "telemetry.enabled"]
}
```

In this example:

- `proxy.http` is overridden to the site-specific proxy (`/etc` wins over `/usr/share`)
- `telemetry.enabled` keeps the default value `false` from `/usr/share` (no override in `/etc`)
- Both keys are locked and cannot be changed by the user

## Additional resources

- [Configuring a managed user environment](/docs/configuration/managed-configuration)
- [Configuration settings reference](/docs/configuration/settings-reference)
- [Podman upstream registry settings reference](https://github.com/containers/image/blob/main/docs/containers-registries.conf.5.md)
