import type { ServerResponse } from 'node:http';

export type WorkbenchEvent = {
  id: string;
  type: string;
  at: string;
  payload: unknown;
};

export type EventStream = {
  publish(type: string, payload: unknown): WorkbenchEvent;
  snapshot(): WorkbenchEvent[];
  respond(response: ServerResponse, replayOnly?: boolean): void;
};

export function createEventStream(limit = 100): EventStream {
  const events: WorkbenchEvent[] = [];
  const clients = new Set<ServerResponse>();
  let sequence = 0;
  const publish = (type: string, payload: unknown): WorkbenchEvent => {
    const event = { id: String(++sequence), type, at: new Date().toISOString(), payload };
    events.push(event);
    if (events.length > limit) events.splice(0, events.length - limit);
    const encoded = `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of clients) client.write(encoded);
    return event;
  };
  return {
    publish,
    snapshot: () => [...events],
    respond(response, replayOnly = false) {
      response.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache',
        connection: replayOnly ? 'close' : 'keep-alive',
      });
      response.flushHeaders();
      response.write(': connected\n\n');
      for (const event of events) {
        response.write(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      }
      if (replayOnly) { response.end(); return; }
      clients.add(response);
      response.on('close', () => clients.delete(response));
    },
  };
}
