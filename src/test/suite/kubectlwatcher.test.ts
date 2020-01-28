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

import * as sinon from 'sinon';
import * as extension from '../../extension';
import * as utils from '../../CamelKJSONUtils';

suite("Kubectl integration watcher", function() {

	let messageSpy = sinon.spy(utils, "shareMessage");

	this.beforeEach(() => {
		messageSpy.resetHistory();
	});

	test('Check there is no loop for closing kubectl process', async function() {
		await sleep(1000);
		sinon.assert.notCalled(messageSpy);
	});

	test('Check there is one message logged in case of connection error', async function() {
		await extension.getIntegrationsFromKubectlCliWithWatch();
		sinon.assert.calledOnce(messageSpy);
	});

});

function sleep(ms = 0) {
	return new Promise(r => setTimeout(r, ms));
}
