// Function to open the side menu
function openMenu() {
    document.getElementById("sideMenu").style.width = "250px"; // Adjust width as needed
    document.getElementById("menu").style.display = "none"
  }
  
  // Function to close the side menu
  function closeMenu() {
    document.getElementById("sideMenu").style.width = "0";
  }
  
  
  document.addEventListener("DOMContentLoaded", function () {
      const form = document.querySelector(".offer-property-form");
      const inputs = form.querySelectorAll("input, select, textarea");
      const sendBtn = document.querySelector(".send-btn");
      const fileInput = document.getElementById("pictures");
      const uploadPreview = document.createElement("div");
      uploadPreview.style.marginTop = "10px";
  
      fileInput.parentElement.appendChild(uploadPreview);
  
      // Colors
      const orangeColor = "#e87c00";
      const errorColor = "#ff3333";
  
      // Real-time form validation
      inputs.forEach((input) => {
          input.addEventListener("input", () => {
              if (input.value.trim() !== "") {
                  input.style.borderColor = orangeColor;
              } else {
                  input.style.borderColor = errorColor;
              }
              validateForm();
          });
      });
  
      // File Upload Preview
      fileInput.addEventListener("change", () => {
          uploadPreview.innerHTML = ""; // Clear previous previews
          const files = fileInput.files;
  
          if (files.length > 0) {
              for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  if (file.type.startsWith("image/")) {
                      const reader = new FileReader();
                      reader.onload = function (e) {
                          const img = document.createElement("img");
                          img.src = e.target.result;
                          img.style.width = "100px";
                          img.style.marginRight = "10px";
                          img.style.border = `2px solid ${orangeColor}`;
                          img.style.borderRadius = "5px";
                          uploadPreview.appendChild(img);
                      };
                      reader.readAsDataURL(file);
                  }
              }
          }
      });
  
      // Validate the entire form
      function validateForm() {
          let isValid = true;
  
          inputs.forEach((input) => {
              if (input.hasAttribute("required") && input.value.trim() === "") {
                  isValid = false;
              }
          });
  
          // Button color update
          if (isValid) {
              sendBtn.style.backgroundColor = orangeColor;
          } else {
              sendBtn.style.backgroundColor = "#ccc";
          }
  
          return isValid;
      }
  });
  
  
  document.getElementById("offer-property-form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission
  
    const form = event.target;
    const formData = new FormData(form);
  
    try {
        const response = await fetch("/offer-property", {
            method: "POST",
            body: formData,
        });
  
        const result = await response.json();
  
        const popup = document.getElementById("popup-message");
        const popupText = document.getElementById("popup-text");
  
        if (result.success) {
            popupText.textContent = result.message;
            popupText.style.color = "green";
        } else {
            popupText.textContent = result.message;
            popupText.style.color = "red";
        }
  
        popup.classList.remove("hidden");
  
        // Reload the page after 3 seconds
        setTimeout(() => {
            popup.classList.add("hidden");
            window.location.reload();
        }, 3000);
    } catch (error) {
        console.error("Error submitting form:", error);
    }
  });
  
  document.getElementById("close-popup").addEventListener("click", function () {
    const popup = document.getElementById("popup-message");
    popup.classList.add("hidden");
  });
  