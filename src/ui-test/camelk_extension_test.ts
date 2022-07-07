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

import * as pjson from '../../package.json';
import { assert } from 'chai';
import { EditorView, ExtensionsViewItem, VSBrowser, WebDriver } from 'vscode-extension-tester';
import { DefaultWait, Marketplace } from 'vscode-uitests-tooling';
import { extensionIsActivated } from './utils/waitConditions';

describe('Tooling for Apache Camel K extension', function () {
	this.timeout(180000);

	let driver: WebDriver;

	describe('Extensions view', function () {
		let marketplace: Marketplace;
		let item: ExtensionsViewItem;

		before(async function () {
			driver = VSBrowser.instance.driver;
			VSBrowser.instance.waitForWorkbench;
		});

		after(async function () {
			await marketplace.close();
			await new EditorView().closeAllEditors();
			// TMP static wait workaround for unexpected vscode-extension-tester 'afterAll' timeout on Fedora
			await DefaultWait.sleep(10000);
		});

		it('Open Marketplace', async function () {
			this.retries(3);
			marketplace = await Marketplace.open(this.timeout());
		});

		it('Find extension', async function () {
			this.retries(3);
			item = await marketplace.findExtension(`@installed ${pjson.displayName}`);
		});

		it('Extension was properly activated', async function () {
			this.timeout(120000);
			await driver.wait(async () => {
				// on macOS the extension is sometimes activated immediately and it causes UI test flakiness
				if (process.platform == 'darwin') {
					item = await marketplace.findExtension(`@installed ${pjson.displayName}`);
				}
				return extensionIsActivated(item);
			}, 120000);
		});

		it('Extension is installed', async function () {
			this.timeout(5000);
			const installed = await item.isInstalled();
			assert.isTrue(installed);
		});

		it('Verify author', async function () {
			this.timeout(5000);
			const author = await item.getAuthor();
			assert.equal(author, 'Red Hat');
		});

		it('Verify display name', async function () {
			this.timeout(5000);
			const title = await item.getTitle();
			assert.equal(title, `${pjson.displayName}`);
		});

		it('Verify description', async function () {
			this.timeout(5000);
			const desc = await item.getDescription();
			assert.equal(desc, `${pjson.description}`);
		});

		it('Verify version', async function () {
			this.timeout(5000);
			const version = await item.getVersion();
			assert.equal(version, `${pjson.version}`);
		});
	});

});
