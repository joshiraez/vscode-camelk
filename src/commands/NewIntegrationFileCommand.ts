/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import { TelemetryEvent } from '@redhat-developer/vscode-redhat-telemetry/lib';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as kamel from '../kamel';
import { getTelemetryServiceInstance } from '../Telemetry';
import { LANGUAGES_WITH_FILENAME_EXTENSIONS, LANGUAGES } from '../IntegrationConstants';

const validFilename = require('valid-filename');

export async function create(...args: any[]) : Promise<void> {
	let language : string | undefined;
	let workspaceFolder : vscode.WorkspaceFolder | undefined;
	if (vscode.workspace.workspaceFolders) {
		// default to root workspace folder
		workspaceFolder = vscode.workspace.workspaceFolders[0];
	}
	let filename : string | undefined;

	// for didact use, we expect two arguments -- filename and language
	// Didact is being removed as part of FUSETOOLS2-1690. This code is being
	// only by Didact afaik, but we don't want an API break.
	// Remove this code in the future if we realize is no longer being used.
	if (args && args.length > 0 && Array.isArray(args[0])) {
		const innerArgs1 : any[] = args[0];
		if (innerArgs1[0] && innerArgs1[1]) {
			filename = innerArgs1[0];
			language = innerArgs1[1];
		}
	}

	if (!language && !filename) {
		const selectedLanguage: string | undefined = await vscode.window.showQuickPick(LANGUAGES, {placeHolder:'Please select the language in which the new file will be generated.'});
		if (selectedLanguage) {
			const selectedWorkspaceFolder: vscode.WorkspaceFolder | undefined = await vscode.window.showWorkspaceFolderPick( {placeHolder: 'Please select the workspace folder in which the new file will be created.'} );
			if (selectedWorkspaceFolder) {
				filename = await vscode.window.showInputBox({
					prompt: 'Please provide a name for the new file (without extension)',
					validateInput: (name: string) => {
						return validateFileName(name, selectedLanguage, selectedWorkspaceFolder);
					}
				});
				language = selectedLanguage;
				workspaceFolder = selectedWorkspaceFolder;
			}
		}
	}

	if (filename && language && workspaceFolder) {
		const kamelExecutor: kamel.Kamel = kamel.create();
		const newFileFullPath: string = computeFullpath(language, workspaceFolder, filename);
		await kamelExecutor.invoke(`init "${newFileFullPath}"`);
		const textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(newFileFullPath);
		await vscode.window.showTextDocument(textDocument);
		const telemetryService = await getTelemetryServiceInstance();
		const telemetryEvent: TelemetryEvent = {
			type: 'track',
			name: 'command',
			properties: {
				identifier: 'camelk.integrations.createNewIntegrationFile',
				language: language
			}
		};
		telemetryService.send(telemetryEvent);
	}
}

function computeFullpath(language: string, workspaceFolder: vscode.WorkspaceFolder, fileName: string): string {
	const fileExtension: string = getFileExtensionForLanguage(language);
	return path.join(workspaceFolder.uri.fsPath, `${fileName}.${fileExtension}`);
}

export function validateFileName(name: string, language: string, workspaceFolder: vscode.WorkspaceFolder): string | undefined {
	if (!name) {
		return 'Please provide a name for the new file (without extension)';
	}
	const newFilePotentialFullPath: string = computeFullpath(language, workspaceFolder, name);
	if (fs.existsSync(newFilePotentialFullPath)) {
		return 'There is already a file with the same name. Please choose a different name.';
	}
	if (!validFilename(name)) {
		return 'The filename is invalid.';
	}
	const patternJavaNamingConvention = '[A-Z][a-zA-Z_$0-9]*';
	if ((language === 'Java' || language === 'Groovy') && !name.match(patternJavaNamingConvention)) {
		return `The filename needs to follow the ${language} naming convention. I.e. ${patternJavaNamingConvention}`;
	}
	return undefined;
}

function getFileExtensionForLanguage(language: string): string {
	const fileExtension: string | undefined = LANGUAGES_WITH_FILENAME_EXTENSIONS.get(language);
	return fileExtension ? fileExtension : 'unknown';
}
