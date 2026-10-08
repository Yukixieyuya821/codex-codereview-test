export class Outbox {
  constructor(maxAttempts = 3) {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new RangeError('maxAttempts');
    this.maxAttempts = maxAttempts; this.entries = new Map();
  }
  enqueue(event) {
    if (typeof event.id !== 'string' || !event.id.trim()) throw new TypeError('event id required');
    const serialized = JSON.stringify(event);
    const existing = this.entries.get(event.id);
    if (existing) {
      if (existing.serialized !== serialized) throw new Error('event id reused with different payload');
      return false;
    }
    this.entries.set(event.id, {event:structuredClone(event),serialized,status:'pending',attempts:0,error:null});
    return true;
  }
  async drain(handler) {
    const outcomes=[];
    for (const entry of this.entries.values()) {
      if (entry.status !== 'pending') continue;
      entry.attempts++;
      try {
        await handler(structuredClone(entry.event));
        entry.status = 'delivered'; entry.error = null;
      } catch (error) {
        entry.error = String(error.message);
        entry.status = entry.attempts >= this.maxAttempts ? 'dead' : 'pending';
      }
      outcomes.push({id:entry.event.id,status:entry.status,attempts:entry.attempts});
    }
    return outcomes;
  }
}
