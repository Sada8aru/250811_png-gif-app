import { getDomRefs } from "./domRefs";

const showError = (message: string) => {
  const { errorMessage } = getDomRefs();
  if (!errorMessage) return;

  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  errorMessage.style.backgroundColor = "#f44336";
  errorMessage.style.color = "white";
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 5000);
};

const showSuccess = (message: string) => {
  const { errorMessage } = getDomRefs();
  if (!errorMessage) return;

  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  errorMessage.style.backgroundColor = "#4CAF50";
  errorMessage.style.color = "white";
  setTimeout(() => {
    errorMessage.style.display = "none";
    errorMessage.style.backgroundColor = "#f44336";
    errorMessage.style.color = "white";
  }, 3000);
};

export { showError, showSuccess };
