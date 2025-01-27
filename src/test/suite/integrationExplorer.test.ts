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
import * as vscode from 'vscode';
import * as chai from 'chai';
import * as extension from '../../extension';
import * as CamelKNodeProvider from '../../CamelKNodeProvider';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as Utils from './Utils';

const expect = chai.expect;
chai.use(sinonChai);

suite('Camel-k Integrations View', () => {

	let sandbox: sinon.SinonSandbox;
	let integrationExplorer: CamelKNodeProvider.CamelKNodeProvider;

	setup(() => {
		Utils.ensureExtensionActivated();
		sandbox = sinon.createSandbox();
		integrationExplorer = extension.camelKIntegrationsProvider;
		integrationExplorer.setRetrieveIntegrations(false);
	});

	teardown(() => {
		sandbox.restore();
		integrationExplorer.setRetrieveIntegrations(true);
	});

	test('adding a single child should trigger a refresh', function(done) {
		integrationExplorer.resetList();
		const refreshStub = sandbox.stub(integrationExplorer, 'refresh');
		integrationExplorer.getChildren().then( (children) => {
			const newNode = new CamelKNodeProvider.TreeNode("string", "mockIntegration", "running", vscode.TreeItemCollapsibleState.None);
			integrationExplorer.addChild(children, newNode, false);
			expect(children.length).equals(1);
			expect(children[0].label).equals("mockIntegration");
			expect(refreshStub.calledOnce, 'Refresh method was not called once').true;
			done();
		});
	});

	test('adding and removing a child should trigger refresh twice', function(done) {
		integrationExplorer.resetList();
		const refreshStub = sandbox.stub(integrationExplorer, 'refresh');
		integrationExplorer.getChildren().then( (children) => {
			const newNode = new CamelKNodeProvider.TreeNode("string", "mockIntegration", "running", vscode.TreeItemCollapsibleState.None);
			integrationExplorer.addChild(children, newNode);
			integrationExplorer.removeChild(children, newNode);
			expect(refreshStub.calledTwice, 'Refresh method was nto called twice').true;
			done();
		});
	});

	test('verify that we are successfully retrieving tree image for running status', function(done) {
		checkIConForPodStatus("running");
		done();
	});

	test('verify that we are successfully retrieving tree images for not running status', function(done) {
		checkIConForPodStatus("not running");
		done();
	});
});

function checkIConForPodStatus(status: string) {
	const context = extension.getStashedContext();
	const iconPath = CamelKNodeProvider.TreeNode.getIconForPodStatus(status, context);
	assert.notEqual(iconPath, undefined);
	if (iconPath) {
		const runningPath: string = path.resolve(iconPath.fsPath);
		assert.equal(fs.existsSync(runningPath), true);
	}
}
