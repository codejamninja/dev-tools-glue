import { Actions, Message, Port, Ports } from './types';

const connections: Ports = {};

export function postMessage(tabId: number, message: Message) {
  if (tabId in connections) {
    return connections[tabId.toString()].postMessage(message);
  }
}

export function registerBackground() {
  chrome.runtime.onConnect.addListener((port: Port) => {
    function handleMessage(message: Message, _port: Port) {
      const tabId = (message.tabId || port.sender?.tab?.id || null) as
        | number
        | null;
      const actions: Actions = {
        register() {
          if (
            port.sender?.tab?.id &&
            !(port.sender.tab.id.toString() in connections)
          ) {
            connections[port.sender.tab.id.toString()] = port;
          }
        },
        log() {
          return tabId ? postMessage(tabId, message) : undefined;
        }
      };
      const action = ((actionName: string) => actions[actionName])(
        message.action
      );
      return action();
    }
    port.onMessage.addListener(handleMessage);
    port.onDisconnect.addListener((port: Port) => {
      port.onMessage.removeListener(handleMessage);
      Object.keys(connections).forEach((tabIdString: string) => {
        if (connections[tabIdString] == port) delete connections[tabIdString];
      });
    });
  });
}
