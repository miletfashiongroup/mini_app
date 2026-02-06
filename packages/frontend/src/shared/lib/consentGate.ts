type RetryFn = () => Promise<unknown> | void;

type ConsentListener = (state: { required: boolean; pending: number }) => void;

let consentRequired = false;
let listeners: ConsentListener[] = [];
const retryQueue: RetryFn[] = [];

export const notifyConsentRequired = (retry?: RetryFn) => {
  consentRequired = true;
  if (retry) {
    retryQueue.push(retry);
  }
  listeners.forEach((listener) =>
    listener({ required: consentRequired, pending: retryQueue.length }),
  );
};

export const clearConsentRequired = () => {
  consentRequired = false;
  listeners.forEach((listener) =>
    listener({ required: consentRequired, pending: retryQueue.length }),
  );
};

export const retryConsentBlockedRequests = async () => {
  const pending = retryQueue.splice(0, retryQueue.length);
  for (const retry of pending) {
    try {
      await retry();
    } catch {
      // ignore retry failures
    }
  }
};

export const subscribeConsentRequired = (listener: ConsentListener) => {
  listeners = [...listeners, listener];
  listener({ required: consentRequired, pending: retryQueue.length });
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
};
