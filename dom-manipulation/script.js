const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

let quotes = [];

function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    quotes = [
      { text: "The best way to predict the future is to create it.", category: "Motivation" },
      { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
      { text: "Your time is limited, so don’t waste it living someone else’s life.", category: "Inspiration" }
    ];
    saveQuotes();
  }
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function populateCategories() {
  const categories = Array.from(new Set(quotes.map(q => q.category)));
  categorySelect.innerHTML = '<option value="all">All</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function categoryFilter() {
  const selectedCategory = categorySelect.value;
  return selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);
}

// ✅ RENAMED from filterQuote to showRandomQuote
function showRandomQuote() {
  const filteredQuotes = categoryFilter();

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  postQuoteToServer(newQuote);

  document.getElementById("newQuoteText").value = '';
  document.getElementById("newQuoteCategory").value = '';
  alert("Quote added!");
}

function createAddQuoteForm() {
  const container = document.getElementById("addQuoteFormContainer");
  container.innerHTML = '';

  const inputQuote = document.createElement("input");
  inputQuote.type = "text";
  inputQuote.id = "newQuoteText";
  inputQuote.placeholder = "Enter a new quote";

  const inputCategory = document.createElement("input");
  inputCategory.type = "text";
  inputCategory.id = "newQuoteCategory";
  inputCategory.placeholder = "Enter quote category";

  const button = document.createElement("button");
  button.textContent = "Add Quote";
  button.addEventListener("click", addQuote);

  container.appendChild(inputQuote);
  container.appendChild(inputCategory);
  container.appendChild(button);
}

function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid format.");
      const uniqueQuotes = importedQuotes.filter(iq =>
        !quotes.some(q => q.text === iq.text && q.category === iq.category)
      );
      quotes.push(...uniqueQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function showLastViewedQuote() {
  const last = sessionStorage.getItem("lastViewedQuote");
  if (last) {
    const quote = JSON.parse(last);
    quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
  }
}

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const posts = await response.json();

    let updated = false;

    posts.slice(0, 10).forEach(post => {
      const newQuote = {
        text: post.title,
        category: "Placeholder"
      };

      const exists = quotes.some(q =>
        q.text === newQuote.text && q.category === newQuote.category
      );

      if (!exists) {
        quotes.push(newQuote);
        updated = true;
      }
    });

    if (updated) {
      saveQuotes();
      populateCategories();
      notifyUser("Quotes synced with server!");
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    notifyUser("Failed to sync with placeholder server.");
  }
}

function postQuoteToServer(quote) {
  fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quote)
  })
    .then(response => response.json())
    .then(data => {
      console.log("Quote posted to server:", data);
    })
    .catch(error => {
      console.error("Failed to post quote:", error);
    });
}

function syncQuotes() {
  fetchQuotesFromServer();
  saveQuotes();
}

function notifyUser(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.backgroundColor = "#d9edf7";
  notification.style.color = "#31708f";
  notification.style.padding = "10px";
  notification.style.margin = "10px 0";
  notification.style.border = "1px solid #bce8f1";
  notification.style.borderRadius = "5px";
  document.body.insertBefore(notification, document.body.firstChild);
  setTimeout(() => notification.remove(), 5000);
}

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");

// Event listeners
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
categorySelect.addEventListener("change", showRandomQuote);

// Initialization
window.onload = () => {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();
  showLastViewedQuote();
  syncQuotes();
  setInterval(syncQuotes, 30000);
};
