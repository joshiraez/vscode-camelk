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

import { expect } from "chai";
import * as fs from 'fs';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { fail } from "assert";
import { waitUntil } from 'async-wait-until';
import { TelemetryEvent } from '@redhat-developer/vscode-redhat-telemetry/lib';
import { getTelemetryServiceInstance } from "../../../Telemetry";

const os = require('os');

suite('Test command to create an Apache Camel K integration file', function() {

	let showQuickpickStub: sinon.SinonStub;
	let showInputBoxStub: sinon.SinonStub;
	let showWorkspaceFolderPickStub: sinon.SinonStub;
	let telemetrySpy: sinon.SinonSpy;
	let createdFile: vscode.Uri;

	setup(async () => {
		showQuickpickStub = sinon.stub(vscode.window, 'showQuickPick');
		showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		showWorkspaceFolderPickStub = sinon.stub(vscode.window, 'showWorkspaceFolderPick');
		telemetrySpy = sinon.spy(await getTelemetryServiceInstance(), 'send');
	});

	teardown(async () => {
		showQuickpickStub.restore();
		showInputBoxStub.restore();
		showWorkspaceFolderPickStub.restore();
		if (createdFile && fs.existsSync(createdFile.fsPath)) {
			fs.unlinkSync(createdFile.fsPath);
		}
		telemetrySpy.restore();
	});

	const javaTest = test('Can create a new java integration file', async function() {
		await testIntegrationFileCreation('TestCreation.java', 'Java', 'TestCreation', javaTest);
	});

	const xmlTest = test('Can create a new xml integration file', async function() {
		await testIntegrationFileCreation('TestCreation.xml', 'XML', 'TestCreation', xmlTest);
	});

	const yamlTest = test('Can create a new yaml integration file', async function() {
		await testIntegrationFileCreation('TestCreation.yaml', 'Yaml', 'TestCreation', yamlTest);
	});

	const groovyTest = test('Can create a new Groovy integration file', async function() {
		await testIntegrationFileCreation('TestCreation.groovy', 'Groovy', 'TestCreation', groovyTest);
	});

	const kotlinTest = test('Can create a new Kotlin integration file', async function() {
		await testIntegrationFileCreation('TestCreation.kts', 'Kotlin', 'TestCreation', kotlinTest);
	});

	const javascriptTest = test('Can create a new JavaScript integration file', async function() {
		await testIntegrationFileCreation('TestCreation.js', 'JavaScript', 'TestCreation', javascriptTest);
	});

	const withSpaceTest = test('Can create a new integration file with space', async function() {
		await testIntegrationFileCreation('Test Creation with space.xml', 'XML', 'Test Creation with space', withSpaceTest);
	});

	async function testIntegrationFileCreation(expectedFileNameWithExtension: string, languageToPick: string, providedFilename: string, currentTest: Mocha.Test) {
		if (os.homedir().includes('hudson')) {
			currentTest.skip();
		}
		expect(await vscode.workspace.findFiles(expectedFileNameWithExtension)).to.be.an('array').that.is.empty;
		showQuickpickStub.onFirstCall().returns(languageToPick);
		const workspaceFolder = (vscode.workspace.workspaceFolders as vscode.WorkspaceFolder[])[0];
		showWorkspaceFolderPickStub.returns(workspaceFolder);
		showInputBoxStub.onFirstCall().returns(providedFilename);

		await vscode.commands.executeCommand('camelk.integrations.createNewIntegrationFile');

		await checkFileCreated(expectedFileNameWithExtension);

		await waitUntil(() => {
			return vscode.window.activeTextEditor?.document.fileName.endsWith(expectedFileNameWithExtension);
		}, 5000);

		checkContainsCamelKMode(createdFile);
		checkTelemetry(telemetrySpy, languageToPick);
	}

	function checkContainsCamelKMode(file: vscode.Uri) {
		expect(fs.readFileSync(file.fsPath, 'utf-8')).to.include("camel-k");
	}

	async function checkFileCreated(expectedFileNameWithExtension: string) {
		let files: vscode.Uri[] = [];
		await waitUntil(() => {
			vscode.workspace.findFiles(expectedFileNameWithExtension).then(res => {
				files = res;
			});
			if (files.length === 1) {
				createdFile = files[0];
				return true;
			}
			return false;
		}).catch(() => {
			fail(
				`File with expected name ${expectedFileNameWithExtension} not found in the workspace when calling command to create a new Camel K file.\n`+
				`Until https://github.com/apache/camel-k/issues/1368 is fixed, it will require to have a valid local Kubernetes setup.`);
		});
	}

	const javaArgsTest = test('Can create a new java integration file with arguments instead of user input', async function() {
		await testIntegrationFileCreationPassingArguments('TestArgsCreation.java', 'Java', 'TestArgsCreation', javaArgsTest);
	});

	async function testIntegrationFileCreationPassingArguments(expectedFileNameWithExtension: string, languageToPick: string, providedFilename: string, currentTest: Mocha.Test) {
		if (os.homedir().includes('hudson')) {
			currentTest.skip();
		}
		expect(await vscode.workspace.findFiles(expectedFileNameWithExtension)).to.be.an('array').that.is.empty;
		telemetrySpy.resetHistory();
		
		await vscode.commands.executeCommand('camelk.integrations.createNewIntegrationFile', providedFilename, languageToPick);

		await checkFileCreated(expectedFileNameWithExtension);

		await waitUntil(() => {
			return vscode.window.activeTextEditor?.document.fileName.endsWith(expectedFileNameWithExtension);
		}, 5000);

		checkContainsCamelKMode(createdFile);
		checkTelemetry(telemetrySpy, languageToPick);
	}

});

function checkTelemetry(telemetrySpy: sinon.SinonSpy<any[], any>, languageToPick: string) {
	expect(telemetrySpy.calledOnce).true;
	const actualEvent: TelemetryEvent = telemetrySpy.getCall(0).args[0];
	expect(actualEvent.name).to.be.equal('command');
	expect(actualEvent.properties.language).to.be.equal(languageToPick);
}
