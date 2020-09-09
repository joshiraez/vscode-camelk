/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import * as fs from 'fs';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { basicIntegration } from '../../IntegrationUtils';
import { skipOnJenkins, getCamelKIntegrationsProvider, openCamelKTreeView } from "./Utils";
import { assert } from 'chai';
import waitUntil = require('async-wait-until');

const RUNNING_TIMEOUT: number = 360000;
const DEPLOYED_TIMEOUT: number = 5000;
const EDITOR_OPENED_TIMEOUT: number = 5000;
const TOTAL_TIMEOUT: number = RUNNING_TIMEOUT + DEPLOYED_TIMEOUT + EDITOR_OPENED_TIMEOUT;

suite('Check can deploy default examples', () => {

	let showQuickpickStub: sinon.SinonStub;
	let showInputBoxStub: sinon.SinonStub;
	let showWorkspaceFolderPickStub: sinon.SinonStub;
	let createdFile: vscode.Uri | undefined;

	setup(() => {
		showQuickpickStub = sinon.stub(vscode.window, 'showQuickPick');
		showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		showWorkspaceFolderPickStub = sinon.stub(vscode.window, 'showWorkspaceFolderPick');
	});

	teardown(() => {
		showQuickpickStub.restore();
		showInputBoxStub.restore();
		showWorkspaceFolderPickStub.restore();
		if (createdFile && fs.existsSync(createdFile.fsPath)) {
			fs.unlinkSync(createdFile.fsPath);
		}
	});

	const testJava = test('Check can deploy Java example', async () => {
		skipOnJenkins(testJava);
		createdFile = await createFile(showQuickpickStub, showWorkspaceFolderPickStub, showInputBoxStub);

		await openCamelKTreeView();
		assert.isEmpty(getCamelKIntegrationsProvider().getTreeNodes());

		showQuickpickStub.onSecondCall().returns(basicIntegration);
		await vscode.commands.executeCommand('camelk.startintegration');

		await checkIntegrationDeployed();
		await checkIntegrationRunning();
	}).timeout(TOTAL_TIMEOUT);

});

async function checkIntegrationRunning() {
	try {
		await waitUntil(() => {
			return getCamelKIntegrationsProvider().getTreeNodes()[0]?.status === "Running";
		}, RUNNING_TIMEOUT, 1000);
	} catch (error) {
		assert.fail(`The integration has not been marked as Running in Camel K Integration provided view. Current status ${getCamelKIntegrationsProvider().getTreeNodes()[0].status}`);
	}
}

async function checkIntegrationDeployed() {
	try {
		await waitUntil(() => {
			return getCamelKIntegrationsProvider().getTreeNodes().length === 1;
		}, DEPLOYED_TIMEOUT, 1000);
	} catch (error) {
		assert.fail('No integration has shown up in Camel K Integration provider view. (Nota: it requires that Camel K instance is reachable.)');
	}
}

async function createFile(showQuickpickStub: sinon.SinonStub<any[], any>, showWorkspaceFolderPickStub: sinon.SinonStub<any[], any>, showInputBoxStub: sinon.SinonStub<any[], any>): Promise<vscode.Uri | undefined>{
	showQuickpickStub.onFirstCall().returns('Java');
	const workspaceFolder = (vscode.workspace.workspaceFolders as vscode.WorkspaceFolder[])[0];
	showWorkspaceFolderPickStub.returns(workspaceFolder);
	showInputBoxStub.onFirstCall().returns('TestDeploy');

	await vscode.commands.executeCommand('camelk.integrations.createNewIntegrationFile');

	try {
		await waitUntil(() => {
			return vscode.window.activeTextEditor?.document.fileName.endsWith('TestDeploy.java');
		}, EDITOR_OPENED_TIMEOUT, 1000);
	} catch (error) {
		assert.fail('TestDeploy.java has not been opened in editor.');
	}
	return vscode.window.activeTextEditor?.document.uri;
}