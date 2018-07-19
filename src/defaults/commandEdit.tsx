import * as React from 'react';

import { JupyterLabPlugin, JupyterLab } from '@jupyterlab/application';

import {
    INotebookTracker,
    Notebook,
    NotebookPanel,
    NotebookMode
} from '@jupyterlab/notebook';

import { IDefaultStatusesManager } from './manager';

import { TextItem } from '../component/text';

import { VDomRenderer } from '@jupyterlab/apputils';
// import { CommandRegistry } from '@phosphor/commands';
import { Signal, ISignal } from '@phosphor/signaling';
import { IDisposable } from '@phosphor/disposable';
import { Token } from '@phosphor/coreutils';
import { IStatusContext } from '../contexts';

// tslint:disable-next-line:variable-name
const CommandEditComponent = (
    props: CommandEditComponent.IProps
): React.ReactElement<CommandEditComponent.IProps> => {
    return (
        <TextItem
            source={
                'Mode: ' +
                props.notebookMode.charAt(0).toUpperCase() +
                props.notebookMode.slice(1)
            }
        />
    );
};

namespace CommandEditComponent {
    export interface IProps {
        // handleClick: () => void;
        notebookMode: NotebookMode;
        // tracker: INotebookTracker;
        // commands: CommandRegistry;
    }
}

class CommandEdit extends VDomRenderer<CommandEdit.Model>
    implements ICommandEdit {
    constructor(opts: CommandEdit.IOptions) {
        super();
        this._tracker = opts.tracker;
        // this._commands = opts.commands;

        this._tracker.currentChanged.connect(this._onNotebookChange);

        this.model = new CommandEdit.Model(
            this._tracker.currentWidget && this._tracker.currentWidget.content
        );
    }

    render() {
        if (this.model === null) {
            return null;
        } else {
            return (
                <CommandEditComponent notebookMode={this.model.notebookMode} />
            );
        }
    }

    private _onNotebookChange = (
        tracker: INotebookTracker,
        notebook: NotebookPanel | null
    ) => {
        if (notebook === null) {
            this.model!.notebook = null;
        } else {
            this.model!.notebook = notebook.content;
        }
    };

    private _tracker: INotebookTracker;
    // private _commands: CommandRegistry;
}

namespace CommandEdit {
    export class Model implements VDomRenderer.IModel, ICommandEdit.IModel {
        constructor(notebook: Notebook | null) {
            this.notebook = notebook;
        }

        get notebookMode() {
            return this._notebookMode;
        }

        set notebookMode(notebookMode: NotebookMode) {
            this._notebookMode = notebookMode;
        }

        set notebook(notebook: Notebook | null) {
            this._notebook = notebook;

            if (this._notebook === null) {
                this._notebookMode = 'command';
            } else {
                this._notebookMode = this._notebook.mode;
                this._notebook.stateChanged.connect(this._onChanged);

                this._notebook.activeCellChanged.connect(this._onChanged);

                this._notebook.modelContentChanged.connect(this._onChanged);
            }

            this._stateChanged.emit(void 0);
        }
        get stateChanged() {
            return this._stateChanged;
        }

        get isDisposed() {
            return this._isDisposed;
        }

        dispose() {
            if (this._isDisposed) {
                return;
            }

            Signal.clearData(this);
            this._isDisposed = true;
        }

        private _onChanged = (_notebook: Notebook) => {
            if (_notebook !== null && _notebook !== undefined) {
                this._notebookMode = _notebook.mode;
            } else {
                this._notebookMode = 'command';
            }
            this._stateChanged.emit(void 0);
        };

        private _notebookMode: NotebookMode = 'command';
        private _notebook: Notebook | null = null;

        private _isDisposed: boolean = false;
        private _stateChanged: Signal<this, void> = new Signal(this);
    }

    export interface IOptions {
        tracker: INotebookTracker;
        // commands: CommandRegistry;
    }
}

export interface ICommandEdit extends IDisposable {
    readonly model: ICommandEdit.IModel | null;
    readonly modelChanged: ISignal<this, void>;
}

export namespace ICommandEdit {
    export interface IModel {
        readonly notebookMode: NotebookMode;
        readonly notebook: Notebook | null;
    }
}

// tslint:disable-next-line:variable-name
export const ICommandEdit = new Token<ICommandEdit>(
    'jupyterlab-statusbar/ICommandEdit'
);

export const commandEditItem: JupyterLabPlugin<ICommandEdit> = {
    id: 'jupyterlab-statusbar/default-items:command-edit',
    autoStart: true,
    provides: ICommandEdit,
    requires: [IDefaultStatusesManager, INotebookTracker],
    activate: (
        app: JupyterLab,
        manager: IDefaultStatusesManager,
        tracker: INotebookTracker
    ) => {
        const item = new CommandEdit({
            tracker
        });

        manager.addDefaultStatus('command-edit-item', item, {
            align: 'right',
            priority: 4,
            isActive: IStatusContext.delegateActive(app.shell, [{ tracker }])
        });

        return item;
    }
};
