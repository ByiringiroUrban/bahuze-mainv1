

// Function to open the side menu
function openMenu() {
    document.getElementById("sideMenu").style.width = "250px"; // Adjust width as needed
    document.getElementById("menu").style.display = "none"
}

// Function to close the side menu
function closeMenu() {
    document.getElementById("sideMenu").style.width = "0";
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("spinner-container").style.display = "none";
});

document.addEventListener("readystatechange", function() {
    if (document.readyState !== "complete") {
        document.getElementById("spinner-container").style.display = "flex";
    }
});

window.addEventListener("beforeunload", function() {
    document.getElementById("spinner-container").style.display = "flex";
});