// ==UserScript==
// @name        NeanderDevBar
// @namespace   https://4drian0rtiz.github.io
// @version     1.5
// @description Add a dev sidebar with options and dev tools
// @author      NeanderTech
// @match       https://neanderpruebas.com/erp-pruebas/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @license     MIT
// ==/UserScript==

(function () {
  "use strict";

  // Config Data
  const defaultHide = GM_getValue("defaultHide", true);

  // Define color variables
const colors = {
  backgroundModal: "rgba(0, 0, 0, 0.7)", 
  modalContentBackground: "#4d2900", 
  modalShadow: "rgba(255, 165, 0, 0.5)",
  buttonBackground: "#ff6600",
  subbuttonBackground: "#222222",
  subbuttonTextColor: "#cccccc",
  buttonTextColor: "#f5f5f5", 
  buttonShadow: "rgba(255, 165, 0, 0.7)",
  inputBorder: "#ff6600",
  inputBackground: "#332200",
  inputTextColor: "#ffcc99",
  toggleButtonBackground: "#ff6600",
  toggleButtonBorder: "#000000",
  jsonKeyColor: "#ff9900",
  jsonStringColor: "#ffcc99",
  jsonNumberColor: "#ffcc99",
  jsonBooleanColor: "#ffcc99",
  sidebarBackground: "#2b2b2b",
  sidebarBorderColor: "#a6a6a6",
  checkboxLabelColor: "#ffcc99",
};


  // Define styles
  // Define styles using color variables
  const styles = `
    #custom-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: ${colors.backgroundModal};
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(10px);
    }
    #custom-modal-content {
      background-color: ${colors.modalContentBackground};
      padding: 20px;
      border-radius: 10px;
      max-width: 80%;
      max-height: 80%;
      overflow: auto;
      box-shadow: 0 0 20px ${colors.modalShadow};
      width: 80%;
    }
    #custom-modal button {
      display: block;
      margin: 10px auto 0;
      padding: 10px;
      background-color: ${colors.buttonBackground};
      color: ${colors.buttonTextColor};
      border: none;
      border-radius: 5px;
      box-shadow: 0 0 10px ${colors.buttonShadow};
    }

    .devSbutton {
      display: block;
      width: 100%;
      margin-bottom: 10px;
      padding: 10px;
      background-color: ${colors.buttonBackground};
      color: ${colors.buttonTextColor};
      border: none;
      border-radius: 5px;
      box-shadow: 0 0 10px ${colors.buttonShadow};
      cursor:pointer;
    }
    .devSubbutton {
      display: block;
      width: 20%;
      margin-top: 10px;
      margin-bottom: 10px;
      padding: 10px;
      background-color: ${colors.subbuttonBackground};
      color: ${colors.subbuttonTextColor};
      border: none;
      border-radius: 5px;
      box-shadow: 0 0 10px ${colors.buttonShadow};
      cursor:pointer;
    }
    .devSinput, .devSselect, .devStextarea {
      width: 100%;
      margin-bottom: 10px;
      padding: 10px;
      border-radius: 5px;
      border: 1px solid ${colors.inputBorder};
      background-color: ${colors.inputBackground};
      color: ${colors.inputTextColor};
      box-sizing: border-box;
    }
    .checkbox-label {
      font-size: medium;
      color: ${colors.checkboxLabelColor};
    }
    .toggle-button {
      position: relative;
      top: 50%;
      left: 0;
      width: 48px;
      height: 48px;
      background-color: ${colors.toggleButtonBackground};
      border: 1px solid ${colors.toggleButtonBorder};
      cursor: pointer;
      border-radius: 70%;
      box-shadow: 0 0 10px ${colors.buttonShadow};
      transform: translate(-50%, -50%);
      filter: drop-shadow(0 3px 2px ${colors.buttonShadow});
    }
  `;



  // Insert styles into the document
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

 // Create a container with a background that matches the color palette
  const container = document.createElement("div");
  container.style.cssText = `position: fixed; top: 35%; right: ${
    defaultHide ? "-520px" : "0"
  }; width: 550px; height: fit-content; padding: 10px;`;

  // Create a container for the sidebar
  const sidebar = document.createElement("div");
  sidebar.style.cssText = `position: fixed; top: 25%; right: ${
    defaultHide ? "-700px" : "0"
  }; width: 500px; height: fit-content; background-color: #463f3a; padding: 10px; border-left: 1px solid #ddd; overflow:hidden; border-radius: 4% 2% 5% 4% / 4% 3% 3% 6%`;

  // Create tools section
  const toolsSection = document.createElement("div");
  toolsSection.className = "tools-section";

  // Useful Functions
  // Function to format JSON with colors
   function formatJsonWithColors(json) {
    return JSON.stringify(json, null, 2)
      .replace(/"(.*?)":/g, `<span style="color: ${colors.jsonKeyColor};">"$1"</span>:`)
      .replace(/: "(.*?)"/g, `: <span style="color: ${colors.jsonStringColor};">"$1"</span>`)
      .replace(/: (\d+)/g, `: <span style="color: ${colors.jsonNumberColor};">$1</span>`)
      .replace(/: (null|true|false)/g, `: <span style="color: ${colors.jsonBooleanColor};">$1</span>`);
  }


  // Function to display modal with formatted JSON
  function displayModalWithJson(json) {
    const modal = document.getElementById("custom-modal");
    const modalContent = document.getElementById("custom-modal-content");
    const toggleButtonSidebar = document.getElementById("toggleButtonSidebar");

    modalContent.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; color:white;">${formatJsonWithColors(
      json
    )}</pre>`;
    modal.style.display = "flex";

    if (toggleButtonSidebar) {
    // Buscar el primer elemento padre div
    let parentDiv = toggleButtonSidebar.closest("div");

    // Verificar si el `right` del primer div padre es `0px`
    if (parentDiv && window.getComputedStyle(parentDiv).right === "0px") {
      toggleButtonSidebar.click();
      }
    }
  }

  // Create the modal if it doesn't exist
  if (!document.getElementById("custom-modal")) {
    const modal = document.createElement("div");
    modal.id = "custom-modal";

    const modalContent = document.createElement("div");
    modalContent.id = "custom-modal-content";

    const modalCloseButton = document.createElement("button");
    modalCloseButton.textContent = "Cerrar";

    modalContent.appendChild(modalCloseButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modalCloseButton.addEventListener("click", () => {
      modal.style.display = "none";
      sidebar.style.display = "block";
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
        sidebar.style.display = "block";
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        modal.style.display = "none";
        sidebar.style.display = "block";
      }
    });
  }

  // Append tools section to sidebar
  sidebar.appendChild(toolsSection);

  // Function to toggle visibility of sections
  function toggleSection(section) {
    const sections = toolsSection.querySelectorAll("div");
    sections.forEach((sec) => {
      if (sec !== section) {
        sec.style.display = "none";
      }
    });
    section.style.display =
      section.style.display === "block" ? "none" : "block";
  }

  // ==============================
  // 1. Inspector de Consultas SQL (Últimos Errores de Consultas)
  // ==============================

  const sqlLogButton = document.createElement("button");
  sqlLogButton.textContent = "Ver Logs de Consultas SQL";
  sqlLogButton.className = "devSbutton";

  const sqlLogSection = document.createElement("div");
  sqlLogSection.style.display = "none";

  const numLogsInput = document.createElement("input");
  numLogsInput.type = "number";
  numLogsInput.placeholder = "Cantidad de logs";
  numLogsInput.className = "devSinput";

  const orderSelect = document.createElement("select");
  const ascOption = document.createElement("option");
  ascOption.value = "asc";
  ascOption.textContent = "Ascendente";
  const descOption = document.createElement("option");
  descOption.value = "desc";
  descOption.textContent = "Descendente";
  orderSelect.appendChild(ascOption);
  orderSelect.appendChild(descOption);
  orderSelect.className = "devSselect";

  // Checkbox for selecting database
  const dbCheckboxLogs = document.createElement("input");
  dbCheckboxLogs.type = "checkbox";
  dbCheckboxLogs.id = "dbCheckboxLogs";
  const dbCheckboxLabelLogs = document.createElement("label");
  dbCheckboxLabelLogs.htmlFor = "dbCheckboxLogs";
  dbCheckboxLabelLogs.textContent = "Producción";
  dbCheckboxLabelLogs.className = "checkbox-label";

  // Checkbox for file
  const fileCheckbox = document.createElement("input");
  fileCheckbox.type = "checkbox";
  fileCheckbox.id = "fileCheckbox";
  const fileCheckboxLabel = document.createElement("label");
  fileCheckboxLabel.htmlFor = "fileCheckbox";
  fileCheckboxLabel.textContent = "Este archivo";
  fileCheckboxLabel.className = "checkbox-label";

  // Get Name of current file
  const url = window.location.href;
  const fileName = url.substring(url.lastIndexOf("/") + 1);

  const fetchSqlLogsButton = document.createElement("button");
  fetchSqlLogsButton.className = 'sendButton';
  fetchSqlLogsButton.textContent = "Enviar";
  fetchSqlLogsButton.className = "devSubbutton";

  sqlLogButton.addEventListener("click", () => {
    toggleSection(sqlLogSection);
  });

  fetchSqlLogsButton.addEventListener("click", () => {
    const numLogs = numLogsInput.value || 10;
    const order = orderSelect.value || "desc";
    const useProdDb = !dbCheckboxLogs.checked;
    const file = fileCheckbox.checked ? fileName : null;

    const requestBody = {
      num_logs: parseInt(numLogs, 10),
      recent: order === "desc",
      use_prod_db: useProdDb,
    };

    if (file) {
      requestBody.file = file;
    }

    fetch("http://localhost:6891/api/sqlLog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((logs) => {
        displayModalWithJson(logs);
      })
      .catch((error) => {
        displayModalWithJson({ error: error.message });
      });
  });

  sqlLogSection.appendChild(numLogsInput);
  sqlLogSection.appendChild(orderSelect);
  sqlLogSection.appendChild(dbCheckboxLogs);
  sqlLogSection.appendChild(dbCheckboxLabelLogs);
  sqlLogSection.appendChild(fileCheckbox);
  sqlLogSection.appendChild(fileCheckboxLabel);
  sqlLogSection.appendChild(fetchSqlLogsButton);

  // ==============================
  // 2. Ejecución de Consultas SQL con textarea
  // ==============================

  const runSqlButton = document.createElement("button");
  runSqlButton.textContent = "Ejecutar SQL";
  runSqlButton.className = "devSbutton";

  const runSqlSection = document.createElement("div");
  runSqlSection.style.display = "none";

  const sqlTextArea = document.createElement("textarea");
  sqlTextArea.placeholder = "Escribe tu consulta SQL aquí...";
  sqlTextArea.className = "devStextarea";

  // Checkbox for selecting database
  const dbCheckboxQuery = document.createElement("input");
  dbCheckboxQuery.type = "checkbox";
  dbCheckboxQuery.style.width = '20px';
  dbCheckboxQuery.id = "dbCheckboxQuery";
  const dbCheckboxLabelQuery = document.createElement("label");
  dbCheckboxLabelQuery.htmlFor = "dbCheckboxQuery";
  dbCheckboxLabelQuery.textContent = "Producción";
  dbCheckboxQuery.className = "input";
  dbCheckboxLabelQuery.className = "checkbox-label";

  const runSqlSubmitButton = document.createElement("button");
  runSqlSubmitButton.className = 'sendButton';
  runSqlSubmitButton.textContent = "Enviar Consulta";
  runSqlSubmitButton.className = "devSubbutton";

  runSqlButton.addEventListener("click", () => {
    toggleSection(runSqlSection);
  });

  runSqlSubmitButton.addEventListener("click", () => {
    const query = sqlTextArea.value;
    const useProdDb = !dbCheckboxQuery.checked;
    if (query) {
      fetch("http://localhost:6891/api/sqlQuery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, use_prod_db: useProdDb }),
      })
        .then((response) => response.json())
        .then((data) => {
          displayModalWithJson(data);
        })
        .catch((error) => {
          displayModalWithJson({ error: error.message });
        });
    }
  });

  runSqlSection.appendChild(sqlTextArea);
  runSqlSection.appendChild(dbCheckboxQuery);
  runSqlSection.appendChild(dbCheckboxLabelQuery);
  runSqlSection.appendChild(runSqlSubmitButton);

  // ==============================
  // 3. Modificación de Sesión de Usuario (con prompt)
  // ==============================
  const simulateSessionButton = document.createElement("button");
  simulateSessionButton.textContent = "Modificar Sesión de Usuario";
  simulateSessionButton.className = "devSbutton";
  simulateSessionButton.addEventListener("click", async () => {
    const newLoginValue = prompt("Con que usuario quieres ver esta página:");
    if (newLoginValue) {
      const response = await fetch(
        "https://neanderpruebas.com/erp-pruebas/include/updateSession.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: newLoginValue }),
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        alert("Session cambiada a: " + newLoginValue);
        location.reload();
      } else {
        alert("Error al modificar la sesión: " + result.message);
      }
    }
  });

  // Append buttons and sections to tools section
  toolsSection.appendChild(sqlLogButton);
  toolsSection.appendChild(sqlLogSection);
  //toolsSection.appendChild(showPhpLogsButton);
  toolsSection.appendChild(runSqlButton);
  toolsSection.appendChild(runSqlSection);
  //toolsSection.appendChild(validatePhpButton);
  //toolsSection.appendChild(validatePhpSection);
  toolsSection.appendChild(simulateSessionButton);

  // Add tools section to sidebar
  sidebar.appendChild(toolsSection);

  // Create a toggle button
  const button = document.createElement("button");
  button.id = "toggleButtonSidebar";
  button.className = "toggle-button";
  button.innerHTML =
    '<svg viewBox="0 0 36 36" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"><image width="36" height="36" xlink:href="https://i.ibb.co/vjfxwDq/alien-svgrepo-com.png"/></svg>';
  container.appendChild(button);

  // Define a function for toggling the sidebar
  const toggleSidebar = () => {
    if (hide) {
      sidebar.style.transition = "all 0.2s ease-in-out";
      container.style.transition = "all 0.2s ease-in-out";
      container.style.right = "0";
      sidebar.style.right = "0";
      hide = false;
    } else {
      sidebar.style.transition = "all 0.2s ease-in-out";
      container.style.transition = "all 0.2s ease-in-out";
      container.style.right = `-${currentWidth}px`;
      sidebar.style.right = `-${currentWidth}px`;
      hide = true;
    }
  };

  // Add an event listener for when the button is clicked
  button.addEventListener("click", (e) => {
    e.preventDefault();
    toggleSidebar();
  });

  // Add the sidebar to the page
  container.appendChild(sidebar);
  document.body.appendChild(container);

  // Initialize variables for tracking mouse movements
  let currentWidth = parseInt(sidebar.style.width);
  currentWidth += 30;
  let hide = defaultHide;

  // Configuración
  GM_registerMenuCommand(
    "¿Ocultar barra lateral por defecto?: " +
      (defaultHide ? "✅ Ocultar" : "❌ Mostrar"),
    () => {
      GM_setValue("defaultHide", !defaultHide);
    }
  );

  const sqlExecuteCode = document.getElementById("sqlExecuteCode");
  const sqlExecuteButton = document.getElementById("sqlExecuteButton");

  if (sqlExecuteButton) {
    sqlExecuteButton.addEventListener("click", () => {
      // Crea el objeto de la consulta
      const requestBody = {
        use_prod_db: false,
        query: sqlExecuteCode.textContent.trim(),
      };

      // Realiza la solicitud a tu endpoint para ejecutar la consulta
      fetch("http://localhost:6891/api/sqlQuery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      .then(response => response.json())
      .then(data => {
        // Llama a la función para mostrar el resultado en formato JSON
        displayModalWithJson(data);
      })
      .catch(error => {
        // Maneja errores y muestra en JSON
        displayModalWithJson({ error: error.message });
      });
    });
  }
})();