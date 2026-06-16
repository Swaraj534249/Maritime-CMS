/**
 * In-process email queue: jobs run after the HTTP response is sent, one at a time.
 * No Redis required. Later you can swap this implementation for BullMQ + Redis
 * without changing callers — they still enqueue async functions.
 */
const queue = [];
let draining = false;

function drain() {
  if (draining) return;
  draining = true;
  setImmediate(async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        await job();
      } catch (err) {
        console.error("[emailQueue] job failed:", err.message || err);
      }
    }
    draining = false;
  });
}

function enqueueEmailJob(fn) {
  if (typeof fn !== "function") return;
  queue.push(fn);
  drain();
}

module.exports = { enqueueEmailJob };
