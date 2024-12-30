#!/bin/bash

# Función para cambiar de directorio
function cambiar_directorio() {
    local directorio=$1
    echo "Cambiando a directorio: $directorio"
    cd $directorio || { echo "Error: No se pudo cambiar al directorio $directorio"; exit 1; }
}

# Función para ejecutar el source
function ejecutar_source() {
    local archivo=$1
    echo "Ejecutando source: $archivo"
    source $archivo || { echo "Error: No se pudo ejecutar source en $archivo"; exit 1; }
}

# Función para ejecutar el comando de Python
function ejecutar_python() {
    local script_python=$1
    echo "Ejecutando script de Python: $script_python"
    python3 $script_python || { echo "Error: No se pudo ejecutar $script_python"; exit 1; }
}

# Main
function main() {
    cambiar_directorio "/home/neandertech/devToolSidebarBack"
    ejecutar_source "devToolSidebarBack/bin/activate"
    ejecutar_python "app.py"
}

# Llamada al main
main
