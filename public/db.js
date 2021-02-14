let db;
//  Create a new db request for a "budget" database
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
    // Create object store called "pending"
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
// Check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // Create a transaction on the "pending" db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");

    // Access pending object store
    const store = transaction.objectStore("pending");

    // Add record to store 
    store.add(record);
};

function checkDatabase() {
    // Create a transaction on the "pending" db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");

    // Access pending object store
    const store = transaction.objectStore("pending");

    // Get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST", 
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                // If successfull, open a transaction on "pending" db with readwrite access
                const transaction = db.transaction(["pending"], "readwrite");

                // Access pending object store
                const store = transaction.objectStore("pending");

                // Clear all items in store
                store.clear();
            });
        };
    };
};

// Listen for app comming back online
window.addEventListener("online", checkDatabase);
