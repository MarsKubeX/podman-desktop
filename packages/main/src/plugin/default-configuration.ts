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
import * as path from 'node:path';

import { inject, injectable } from 'inversify';

import { Directories } from './directories.js';
import { SYSTEM_DEFAULTS_FILENAME } from './managed-by-constants.js';

interface TelemetryInfo {
  event: string;
  eventProperties?: unknown;
}

@injectable()
export class DefaultConfiguration {
  private telemetryInfo: TelemetryInfo | undefined;

  constructor(
    @inject(Directories)
    private directories: Directories,
  ) {}

  public async getContent(): Promise<{ [key: string]: unknown }> {
    let foundAnyConfig = false;
    let hadParseError = false;

    // Get the managed defaults file path from directories
    const managedDefaultsDirectories = this.directories.getManagedDefaultsDirectories();
    let mergedConfig: { [key: string]: unknown } = {};

    // Process paths in reverse order (lowest priority first)
    // so higher priority sources override lower ones
    for (const managedDefaultsDirectory of [...managedDefaultsDirectories].reverse()) {
      const managedDefaultsFile = path.join(managedDefaultsDirectory, SYSTEM_DEFAULTS_FILENAME);
      // It's important that we at least log to console what is happening here, as it's common for logs
      // to be shared when there are issues loading "managed-by" defaults, so having this information in the logs is useful.
      try {
        const managedDefaultsContent = await readFile(managedDefaultsFile, 'utf-8');
        const managedDefaultsData = JSON.parse(managedDefaultsContent);

        // Merge with existing config, higher priority sources override lower ones
        mergedConfig = { ...mergedConfig, ...managedDefaultsData };
        console.log(`[Managed-by]: Loaded managed defaults from: ${managedDefaultsFile}`);
        foundAnyConfig = true;
      } catch (error) {
        // Handle file-not-found errors gracefully - this is expected when no managed config exists
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          console.debug(`[Managed-by]: No managed defaults file found at ${managedDefaultsFile}`);
        } else {
          // For other errors (like JSON parse errors), log as error
          console.error(`[Managed-by]: Failed to parse managed defaults from ${managedDefaultsFile}:`, error);
          hadParseError = true;
        }
      }
    }
    // Set telemetry after loop
    if (hadParseError) {
      this.telemetryInfo = {
        event: 'managedConfigurationStartupFailed',
        eventProperties: 'Parse error in one or more files',
      };
    } else if (foundAnyConfig) {
      this.telemetryInfo = { event: 'managedConfigurationEnabled' };
    }
    return mergedConfig;
  }

  public getTelemetryInfo(): TelemetryInfo | undefined {
    return this.telemetryInfo;
  }
}
