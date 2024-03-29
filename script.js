let currentPage = 1;
let perPage = 10; // Number of repositories per page
let maxDisplayedPages = 10; // Max no. of pages

// Access TOKEN to bypass GitHub Limit
const TOKEN = "YOUR_TOKEN_HERE";

// Enter key event to search
document
  .getElementById("usernameInput")
  .addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      getUserData();
    }
  });

// Back to Search Functionality
function backToSearch() {
  document.getElementById("profileContainer").innerHTML = "";
  document.getElementById("repoContainer").innerHTML = "";
  document.getElementById("paginationContainer").innerHTML = "";
  toggleSearchBox(true);
  document.getElementById("backToSearch").classList.add("hidden");
}

// Displaying User Data
function displayUserData(userData) {
  const profileContainer = document.getElementById("profileContainer");
  if (userData.message === "Not Found") {
    profileContainer.innerHTML = `
        <div class="avatar">
        404 User Not Found please enter valid username.
        </div>  
      `;
    return;
  }
  const url = userData.twitter_username
    ? `twitter: <a href=https://twitter.com/${userData.twitter_username} target=_blank>https://twitter.com/${userData.twitter_username}</a>`
    : "";

  const loc = userData.location ? `Location: ${userData.location}` : "";
  profileContainer.innerHTML = `
        <div class="avatar">
        <img src="${userData.avatar_url}" alt="${userData.login} Avatar">
        </div>
        <div class="details">
        <h2>${userData.name}</h2>
        <p>${userData.bio || "<No Bio>"}</p>
        <p><span>Followers: ${userData.followers}&nbsp</span>
        <span>Following: ${userData.following}&nbsp</span>
        <span>Repositories: ${userData.public_repos}&nbsp</span></p>
        <p>
          <span>${loc}</span>&nbsp
          <span>${url}</span>
          </p>
        <p>Url: <a href=${userData.html_url} target= _blank>${
    userData.html_url
  }</p>
        </div>
    `;
}

// Displaying Repositories Data
function displayRepoData(repos, userData) {
  const repoContainer = document.getElementById("repoContainer");
  repoContainer.innerHTML = `<h2>Latest Repositories: </h2>`;
  if (userData.message === "Not Found") {
    repoContainer.innerHTML = `
        <div>
        <h2>Latest Repositories: </h2>
        404 User Not Found.
        </div>  
      `;
    return;
  }
  if (repos.length > 0) {
    repos.forEach(async (repo) => {
      // Fetching for Languages used in the Repository
      const repoLang = await fetch(
        `https://api.github.com/repos/${userData.login}/${repo.name}/languages`,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
      const response = await repoLang.json();
      var paragraph = document.createElement("p");
      for (const key in response) {
        var span = document.createElement("span");
        span.textContent = key;
        paragraph.appendChild(span);
      }
      repoContainer.innerHTML += `
                <div class="list">
                    <p><strong>${repo.name}</strong></p>
                    <p>${repo.description || "No description available"}</p>
                    <p>${paragraph.innerHTML}</p>
                </div>
            `;
    });
  } else {
    repoContainer.innerHTML += `<p>No repositories found for this user.</p>`;
  }
}

// Displaying Error
function displayError(message) {
  const profileContainer = document.getElementById("profileContainer");
  const repoContainer = document.getElementById("repoContainer");

  profileContainer.innerHTML = `<p>${message}</p>`;
  repoContainer.innerHTML = "";
}

// Fetching User Data
async function getUserData() {
  const username = document.getElementById("usernameInput").value;
  const loader = document.querySelector("#loading");

  if (username) {
    try {
      loader.classList.add("display");
      const userProfile = await fetch(
        `https://api.github.com/users/${username}`,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );

      // Fetching Repo List
      const userData = await userProfile.json();
      const repoList = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${currentPage}`,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
      const repos = await repoList.json();
      document.getElementById("backToSearch").classList.remove("hidden");
      displayUserData(userData);
      console.log(userData);
      displayRepoData(repos, userData);
      displayPagination(userData.public_repos);
      toggleSearchBox(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      displayError("User not found. Please enter a valid GitHub username.");
    } finally {
      loader.classList.remove("display");
    }
  } else {
    displayError("Please enter a GitHub username.");
  }
}

// Pagination Functionality
function displayPagination(repoCount) {
  const paginationContainer = document.getElementById("paginationContainer");
  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(repoCount / perPage);

  if (totalPages > 1) {
    const paginationDiv = document.createElement("div");
    paginationDiv.classList.add("pagination");

    if (currentPage > 1) {
      const prevButton = document.createElement("button");
      prevButton.textContent = "Previous";
      prevButton.addEventListener("click", () => {
        currentPage--;
        getUserData();
      });
      paginationDiv.appendChild(prevButton);
    }
    let startPage = 1;

    // If there are more than maxDisplayedPages, calculate startPage
    if (totalPages > maxDisplayedPages) {
      startPage = Math.max(
        1,
        Math.min(
          currentPage - Math.floor(maxDisplayedPages / 2),
          totalPages - maxDisplayedPages + 1
        )
      );
    }

    const endPage = Math.min(startPage + maxDisplayedPages - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement("button");
      pageButton.textContent = i;
      pageButton.addEventListener("click", () => {
        currentPage = i;
        getUserData();
      });
      paginationDiv.appendChild(pageButton);
    }

    if (currentPage < totalPages) {
      const nextButton = document.createElement("button");
      nextButton.textContent = "Next";
      nextButton.addEventListener("click", () => {
        currentPage++;
        getUserData();
      });
      paginationDiv.appendChild(nextButton);
    }
    // Repository per page selection dropdown
    const perPageSelect = document.createElement("select");
    perPageSelect.id = "perPageSelect";
    perPageSelect.onchange = changePerPage;

    // Options for repository per page selection
    [5, 10, 25, 50, 100].forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      if (optionValue === perPage) {
        option.selected = true;
      }
      perPageSelect.appendChild(option);
    });

    paginationDiv.appendChild(perPageSelect);

    paginationContainer.appendChild(paginationDiv);
  }
}

// For changing No. of Repositories per page
function changePerPage() {
  perPage = parseInt(document.getElementById("perPageSelect").value, 10);
  currentPage = 1;
  getUserData();
}

// Toggle Search box
function toggleSearchBox(show) {
  const searchContainer = document.getElementById("searchContainer");
  searchContainer.style.display = show ? "flex" : "none";
}
