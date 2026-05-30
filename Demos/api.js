const apiUrl = 'https://jsonplaceholder.typicode.com/posts';
const usersUrl = 'https://jsonplaceholder.typicode.com/users';

async function fetchPosts() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayPosts(data);
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

function displayPosts(postsData) {
    const todos = document.getElementById('todos');
    todos.innerHTML = ''; // Clear existing content
    postsData.forEach(post => {
        const postItem = document.createElement('li');
        postItem.innerHTML = `<h3>${post.title}</h3><p>${post.body}</p>`;
        todos.appendChild(postItem);
    });
}

async function fetchUsers() {
    try {
        const response = await fetch(usersUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayUsers(data);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

function displayUsers(usersData) {
    const todos = document.getElementById('todos');
    todos.innerHTML = ''; // Clear existing content
    usersData.forEach(user => {
        const userItem = document.createElement('li');
        userItem.innerHTML = `<h3>${user.name}</h3><p>${user.email}</p>`;
        todos.appendChild(userItem);
    });
}
