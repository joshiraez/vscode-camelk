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
import * as path from 'path';
import {
    BottomBarPanel,
    CustomTreeSection,
    DefaultTreeItem,
    EditorView,
    InputBox,
    Locator,
    SideBarView,
    TextEditor,
    ViewItem,
    VSBrowser,
    WebView,
    Workbench
} from 'vscode-extension-tester';
import * as uiTestConstants from '../utils/uiTestConstants';
import { sectionHasItem, viewHasItem } from './waitConditions';

export class DoNextTest {
    doNextTest: boolean;
    firstRun: boolean;

    constructor() {
        this.doNextTest = true;
        this.firstRun = true;
    }

    stopTest() {
        this.doNextTest = false;
    }

    continueTest() {
        this.doNextTest = true;
    }
}

export async function prepareEmptyTestFolder(directory: string): Promise<void> {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    } else {
        // Clean test directory if it exists
        // Windows not allows to delete the whole directory with rmSync
        fs.readdir(directory, async (_err, files) => {
            for (const file of files) {
                try {
                    if (fs.existsSync(path.join(directory, file))) {
                        fs.rmSync(path.join(directory, file), { recursive: true });
                    }
                } catch (err) { console.log(err); }
            }
        });
    }
}

export async function findSectionItem(section: string, item: string): Promise<DefaultTreeItem> {
    const content = new SideBarView().getContent();
    const currentSection = await content.getSection(section);
    await currentSection.expand();
    return await currentSection.findItem(item) as DefaultTreeItem;
}

export async function inputBoxQuickPickOrSet(type: "pick" | "set", indexOrText: string | number): Promise<boolean> {
    const input = await InputBox.create();
    if (type === "pick") {
        await input.selectQuickPick(indexOrText);
        return true;
    } else if (type === "set" && typeof indexOrText === "string") {
        await input.setText(indexOrText);
        await input.confirm();
        return true;
    } else {
        return false;
    }
}

export async function textDoesNotContainAsci(view: 'OutputView' | 'WebView', locator: Locator = { id: 'content' }): Promise<boolean> {
    const ansiRegex = require('ansi-regex');
    let text = '';
    if (view === 'OutputView') {
        const outputView = await new BottomBarPanel().openOutputView();
        await (await new Workbench().openNotificationsCenter()).clearAllNotifications();
        text = await outputView.getText();
    } else {
        const webView = new WebView();
        await webView.switchToFrame();
        const contentElement = await webView.findWebElement(locator);
        text = await contentElement.getText();
        await webView.switchBack();
    }
    return !ansiRegex().test(text);
}

export async function getCamelKIntegrationSection() {
    const section = await new SideBarView().getContent().getSection(uiTestConstants.extensionName) as CustomTreeSection;
    await section.expand();
    await VSBrowser.instance.driver.wait(async () => section.isExpanded());
    return section;
}

export async function getIntegration(integrationLabel: string) {
    const section = await getCamelKIntegrationSection();
    await VSBrowser.instance.driver.wait(async () => hasIntegration(integrationLabel));
    return await section.findItem(integrationLabel) as ViewItem;
}

export async function hasIntegration(integrationLabel: string) {
    const section = await getCamelKIntegrationSection();
    return await sectionHasItem(section, integrationLabel);
}

export async function startIntegration(integrationLabel: string, mode: string) {
    const workbench = new Workbench();
    await workbench.executeCommand(uiTestConstants.startIntegration);
    const startMode = await InputBox.create();
    await startMode.selectQuickPick(mode);
    const content = new SideBarView().getContent();
    await VSBrowser.instance.driver.wait(() => { return viewHasItem(content, uiTestConstants.extensionName, integrationLabel); });
}

export async function createIntegration(integrationFile: string, language: string, extension: string) {
    const workbench = new Workbench();
    await workbench.executeCommand(uiTestConstants.createNewIntegrationFile);
    const languageInput = await InputBox.create();
    await languageInput.selectQuickPick(language);
    const WORKSPACE_FOLDERInput = await InputBox.create();
    await WORKSPACE_FOLDERInput.selectQuickPick(0);
    const nameInput = await InputBox.create();
    await nameInput.setText(integrationFile);
    await nameInput.confirm();

    const editorView = new EditorView();
    await VSBrowser.instance.driver.wait(async () => {
        try {
            return await editorView.openEditor(integrationFile + '.' + extension) !== undefined;
        } catch {
            return false;
        }
    });
    return workbench;
}

export async function modifyCurrentFileToBeInvalid() {
    const textEditor: TextEditor = new TextEditor();
    await textEditor.setTextAtLine(14, ";");
    await textEditor.save()
}