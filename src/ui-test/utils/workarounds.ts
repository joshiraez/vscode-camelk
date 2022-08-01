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

import { DefaultTreeItem, Workbench } from "vscode-extension-tester";
import { inputBoxQuickPickOrSet } from "./utils";

// TODO: Workaround due the issue -> https://github.com/redhat-developer/vscode-extension-tester/issues/444
export async function workaroundMacIssue444(item: DefaultTreeItem, command: string): Promise<boolean> {
    await item.click();
    const workbench = new Workbench();
    await workbench.openCommandPrompt();
    return await inputBoxQuickPickOrSet('set', `>${command}`);
}