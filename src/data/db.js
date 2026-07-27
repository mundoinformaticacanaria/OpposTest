const DB_NAME = 'oppostest';
const DB_VERSION = 1;
const STORES = ['banks', 'topics', 'questions', 'progress', 'attempts', 'settings'];
let databasePromise;

export function openDatabase() {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('banks')) db.createObjectStore('banks', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('topics')) db.createObjectStore('topics', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('questions')) {
        const store = db.createObjectStore('questions', { keyPath: 'id' });
        store.createIndex('bank_id', 'bank_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress', { keyPath: 'question_id' });
      if (!db.objectStoreNames.contains('attempts')) db.createObjectStore('attempts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return databasePromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAll(storeName) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readonly');
  return requestToPromise(transaction.objectStore(storeName).getAll());
}

export async function getOne(storeName, key) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readonly');
  return requestToPromise(transaction.objectStore(storeName).get(key));
}

export async function putOne(storeName, value) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  await requestToPromise(transaction.objectStore(storeName).put(value));
  return value;
}

export async function deleteOne(storeName, key) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  await requestToPromise(transaction.objectStore(storeName).delete(key));
}

export async function clearStore(storeName) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  await requestToPromise(transaction.objectStore(storeName).clear());
}

export async function bulkPut(storeName, values) {
  if (values.length === 0) return;
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    values.forEach((value) => store.put(value));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('Transacción cancelada.'));
  });
}

export async function runTransaction(storeNames, callback) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, 'readwrite');
    const stores = Object.fromEntries(storeNames.map((name) => [name, transaction.objectStore(name)]));
    let callbackResult;

    Promise.resolve(callback(stores, requestToPromise))
      .then((result) => {
        callbackResult = result;
      })
      .catch((error) => {
        transaction.abort();
        reject(error);
      });

    transaction.oncomplete = () => resolve(callbackResult);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('Transacción cancelada.'));
  });
}

export async function exportAllStores() {
  const result = {};
  for (const storeName of STORES) {
    result[storeName] = await getAll(storeName);
  }
  return result;
}

export async function replaceAllStores(data) {
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES, 'readwrite');
    STORES.forEach((storeName) => {
      const store = transaction.objectStore(storeName);
      store.clear();
      const values = Array.isArray(data[storeName]) ? data[storeName] : [];
      values.forEach((value) => store.put(value));
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('No se pudo restaurar la copia.'));
  });
}
