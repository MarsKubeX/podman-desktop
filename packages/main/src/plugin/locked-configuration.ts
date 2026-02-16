/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { inject, injectable } from 'inversify';

import { Directories } from './directories.js';
import { SYSTEM_LOCKED_FILENAME } from './managed-by-constants.js';

interface TelemetryInfo {
  event: string;
  eventProperties?: unknown;
}

@injectable()
export class LockedConfiguration {
  private telemetryInfo: TelemetryInfo | undefined;

  constructor(
    @inject(Directories)
    private directories: Directories,
  ) {}

  public async getContent(): Promise<{ [key: string]: unknown }> {
    const searchPaths = this.directories.getManagedDefaultsDirectories();
    let mergedLockedConfig: { [key: string]: unknown } = {};
    let hadParseError = false;
    let foundAnyLockedConfig = false;

    // Process paths in reverse order (lowest priority first)
    // so higher priority sources override lower ones
    for (const managedLockedDirectory of [...searchPaths].reverse()) {
      const managedLockedFile = join(managedLockedDirectory, SYSTEM_LOCKED_FILENAME);
      try {
        const managedLockedContent = await readFile(managedLockedFile, 'utf-8');
        const managedLockedData = JSON.parse(managedLockedContent);
        // Merge with existing config (later sources override earlier)
        mergedLockedConfig = { ...mergedLockedConfig, ...managedLockedData }; // Simple override
        foundAnyLockedConfig = true;
        console.log(`[Managed-by]: Loaded managed locked from: ${managedLockedFile}`);
      } catch (error) {
        // Handle file-not-found errors gracefully - this is expected when no managed config exists
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          console.debug(`[Managed-by]: No managed locked file found at ${managedLockedFile}`);
        } else {
          // For other errors (like JSON parse errors), log as error
          console.error(`[Managed-by]: Failed to parse managed locked from ${managedLockedFile}:`, error);
          hadParseError = true;
        }
      }
    }
    // Set telemetry after loop
    if (hadParseError) {
      this.telemetryInfo = { event: 'lockedConfigurationStartupFailed', eventProperties: 'Parse error' };
    } else if (foundAnyLockedConfig) {
      this.telemetryInfo = { event: 'managedConfigurationEnabledAndLocked' };
    }
    return mergedLockedConfig;
  }

  public getTelemetryInfo(): TelemetryInfo | undefined {
    return this.telemetryInfo;
  }
}
