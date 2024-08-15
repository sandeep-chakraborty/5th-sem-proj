document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const alertBox = document.querySelector(".alert");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const jsonData = JSON.stringify(Object.fromEntries(formData));

    fetch(form.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showAlert(data.error, "danger");
        } else {
          showAlert(data.message, "success");
        }
      })
      .catch((error) => {
        showAlert("Something went wrong!", "danger");
      });
  });

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove("hidden");
  }
});
