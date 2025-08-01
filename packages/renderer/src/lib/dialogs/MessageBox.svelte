<script lang="ts">
import { faCircle, faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import { faCircleExclamation, faInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Button, type ButtonType, Dropdown } from '@podman-desktop/ui-svelte';
import { onDestroy, onMount } from 'svelte';
import Fa from 'svelte-fa';

import { type ButtonsType, type DropdownType, type IconButtonType } from '/@api/dialog';

import Markdown from '../markdown/Markdown.svelte';
import LegacyDialog from './LegacyDialog.svelte';
import type { MessageBoxOptions } from './messagebox-input';

let currentId = 0;
let title: string;
let message: string;
let detail: string | undefined;
let buttons: ButtonsType[];
let type: string | undefined;
let cancelId = -1;
let defaultId: number;
let buttonOrder: number[];
let footerMarkdownDescription: string | undefined;

let display = false;

const showMessageBoxCallback = (messageBoxParameter: unknown): void => {
  const options: MessageBoxOptions | undefined = messageBoxParameter as MessageBoxOptions;
  currentId = options?.id || 0;
  title = options?.title || '';
  message = options?.message || '';
  if (options?.detail) {
    detail = options.detail;
  } else {
    detail = undefined;
  }

  footerMarkdownDescription = options.footerMarkdownDescription;

  // use provided buttons, or a single 'OK' button if none are provided
  if (options?.buttons && options.buttons.length > 0) {
    buttons = options.buttons;
  } else {
    buttons = ['OK'];
  }
  type = options?.type;

  buttonOrder = Array.from(buttons, (value, index) => index);

  // use the provided cancel id, otherwise try to find a button labelled 'cancel'
  if (options?.cancelId) {
    cancelId = options.cancelId;
  } else {
    cancelId = buttons.findIndex(b => {
      // only for "clasic" buttons and not Dropdown component
      if (typeof b === 'string') return b.toLowerCase() === 'cancel';
    });
  }

  // use the provided default (primary) id, otherwise the first non-cancel button is the default
  if (options?.defaultId) {
    defaultId = options.defaultId;
  } else if (cancelId === 0) {
    defaultId = 1;
  } else {
    defaultId = 0;
  }

  // move cancel button to the start/left and default button to the end/right
  buttonOrder.sort((a, b) => {
    if (a === cancelId || b === defaultId) {
      return -1;
    } else if (a === defaultId || b === cancelId) {
      return 1;
    } else {
      return a - b;
    }
  });

  display = true;
};

onMount(() => {
  // handle the showMessageBox event
  window.events?.receive('showMessageBox:open', showMessageBoxCallback);
});

onDestroy(() => {
  cleanup();
});

function cleanup(): void {
  display = false;
  title = '';
  message = '';
}

async function clickButton(index?: number, dropdownIndex?: number): Promise<void> {
  cleanup();
  await window.sendShowMessageBoxOnSelect(currentId, index, dropdownIndex);
}

async function onClose(): Promise<void> {
  cleanup();
  await window.sendShowMessageBoxOnSelect(currentId, cancelId >= 0 ? cancelId : undefined);
}

function getButtonType(b: boolean): ButtonType {
  // eslint-disable-next-line sonarjs/no-selector-parameter
  if (b) {
    return 'primary';
  } else {
    return 'secondary';
  }
}
</script>

{#if display}
  <LegacyDialog title={title} onclose={onClose}>
    <svelte:fragment slot="icon">
      {#if type === 'error'}
        <Fa class="h-4 w-4 text-[var(--pd-state-error)]" icon={faCircleExclamation} />
      {:else if type === 'warning'}
        <Fa class="h-4 w-4 text-[var(--pd-state-warning)]" icon={faTriangleExclamation} />
      {:else if type === 'info'}
        <div class="flex">
          <Fa class="h-4 w-4 place-content-center" icon={faCircle} />
          <Fa class="h-4 w-4 place-content-center -ml-4 mt-px text-xs" icon={faInfo} />
        </div>
      {:else if type === 'question'}
        <Fa class="h-4 w-4" icon={faCircleQuestion} />
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="content">
      <div class="leading-5" aria-label="Dialog Message">
        <Markdown markdown={message} />
      </div>

      {#if footerMarkdownDescription}
        <div class="pt-4 flex justify-center" aria-label="Footer Description">
          <Markdown markdown={footerMarkdownDescription} />
        </div>
      {/if}
      {#if detail}
        <div class="pt-4 leading-5" aria-label="Dialog Details">{detail}</div>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="buttons">
      {#each buttonOrder as i, index (index)}
        {#if i === cancelId}
          <Button type="link" aria-label="Cancel" on:click={async (): Promise<void> => await clickButton(i)}>Cancel</Button>
        {:else if typeof buttons[i] === 'object'}
          {#if buttons[i].type === 'dropdownButton'}
            {@const dropdownButtons = buttons[i] as DropdownType}
            <Dropdown
              name={dropdownButtons.heading}
              value={dropdownButtons.heading}
              onChange={async (option): Promise<void> => {
                let optionIndex: number | undefined = dropdownButtons.buttons.indexOf(option);
                if (optionIndex === -1) {
                  optionIndex = undefined;
                }
                await clickButton(i, optionIndex);
              }}
              options={dropdownButtons.buttons.map(button => ({label: button, value: button}))}/>
          {:else if buttons[i].type === 'iconButton'}
            {@const button = buttons[i] as IconButtonType}
            <Button type="primary" icon={button.icon} on:click={async (): Promise<void> => await clickButton(i)}>{button.label}</Button>
          {/if}
        {:else}
          <Button type={getButtonType(defaultId === i)} on:click={async (): Promise<void> => await clickButton(i)}>{buttons[i]}</Button>
        {/if}
      {/each}
    </svelte:fragment>
  </LegacyDialog>
{/if}
