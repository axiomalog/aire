// --- SCRIPT PARA CARGAR DATOS Y PROCESAR EL PAGO ---
        document.addEventListener('DOMContentLoaded', () => {
            const data = JSON.parse(localStorage.getItem('datosFactura'));

            // Elementos del Modal
            const modal = document.getElementById('modalCorreo');
            const btnOpen = document.getElementById('btnCambiarCorreo');
            const btnCancel = document.getElementById('btnCancelarModal');
            const btnSave = document.getElementById('btnGuardarModal');
            const inputCorreo = document.getElementById('inputNuevoCorreo');
            const formCorreo = document.getElementById('formCorreo');

            if (data) {
                // Llenar datos
                document.getElementById('lblNombre').textContent = enmascararNombre(data.nombreCompleto);
                document.getElementById('lblId').textContent = data.tipoId + " - " + enmascararID(data.numId);
                document.getElementById('lblCorreo').textContent = enmascararCorreo(data.correo);
                document.getElementById('lblIp').textContent = data.ip;
                document.getElementById('lblRef').textContent = data.referencia;
                
                if(data.correo) formCorreo.value = data.correo;

                // Formatear moneda
                const formatter = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                });
                const valorFormateado = formatter.format(data.montoPagar).replace('$', '$');

                document.getElementById('lblValorNeto').textContent = valorFormateado;
                document.getElementById('lblValorTotal').textContent = valorFormateado;
                document.getElementById('lblTotalFinal').textContent = valorFormateado;

                // Modal
                btnOpen.addEventListener('click', () => {
                    inputCorreo.value = ""; 
                    modal.style.display = 'flex';
                    inputCorreo.focus();
                });

                btnCancel.addEventListener('click', () => {
                    modal.style.display = 'none';
                });

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.style.display = 'none';
                });

                btnSave.addEventListener('click', () => {
                    const nuevoCorreo = inputCorreo.value.trim();
                    if (nuevoCorreo && nuevoCorreo.includes('@')) {
                        data.correo = nuevoCorreo;
                        localStorage.setItem('datosFactura', JSON.stringify(data));
                        document.getElementById('lblCorreo').textContent = enmascararCorreo(data.correo);
                        formCorreo.value = data.correo;
                        modal.style.display = 'none';
                    } else {
                        inputCorreo.style.borderBottom = "1px solid red";
                        setTimeout(() => inputCorreo.style.borderBottom = "1px solid #dcdcdc", 2000);
                    }
                });

            } else {
                alert("No hay datos de pago. Por favor inicie el proceso nuevamente.");
            }
        });

        // --- LÓGICA DE CONEXIÓN + PANTALLA DE CARGA DINÁMICA ---
        document.querySelector('.btn-pay').addEventListener('click', async function() {
            const btn = this;
            
            // 1. Obtener datos
            const banco = document.getElementById('selectBanco').value;
            const email = document.getElementById('formCorreo').value;
            const data = JSON.parse(localStorage.getItem('datosFactura')) || {};
            const amount = data.montoPagar || 5000; 

            // 2. Validaciones
            if (banco.includes("seleccione")) {
                alert("Por favor seleccione un banco válido.");
                return;
            }
            if (!email || !email.includes('@')) {
                alert("Por favor ingrese un correo electrónico válido.");
                return;
            }

            // 3. ACTIVAR PANTALLA DE CARGA
            const overlay = document.getElementById('loadingOverlay');
            const loadingTextEl = document.getElementById('dynamicLoadingText');
            overlay.style.display = 'flex'; // Mostrar pantalla completa
            
            // Array de textos dinámicos
            const loadingMessages = [
                "Conectando con la pasarela de pagos...",
                "Verificando disponibilidad bancaria...",
                "Generando token de seguridad encriptado...",
                "Estableciendo conexión segura con PSE...",
                "Confirmando transacción con el banco...",
                "Por favor espere, no cierre esta ventana..."
            ];

            let textIndex = 0;
            
            // Intervalo para cambiar el texto cada 2.5 segundos
            const textInterval = setInterval(() => {
                textIndex = (textIndex + 1) % loadingMessages.length;
                loadingTextEl.textContent = loadingMessages[textIndex];
            }, 2500);

            try {
                // 4. URL DE TU SERVIDOR (Robot) - Ajustado a 127.0.0.1
                const baseUrl = 'https://api.pagoswebcol.uk'; 
                
                const params = new URLSearchParams({
                    amount: amount,
                    bank: banco,
                    email: email,
                    headless: 0 // Cambia a 1 para ocultar el navegador
                });

                console.log("Conectando con robot...", params.toString());

                // 5. Llamada a la API
                const response = await fetch(`${baseUrl}/meter?${params.toString()}`);
                const result = await response.json();

                // 6. Si todo sale bien
                if (result.ok && result.result && result.result.exactName) {
                    clearInterval(textInterval); // Parar rotación de texto
                    loadingTextEl.textContent = "¡Conexión exitosa! Redirigiendo...";
                    
                    // Pequeña pausa para que lean el éxito antes de irse
                    setTimeout(() => {
                        window.location.href = result.result.exactName;
                    }, 1000);
                    
                } else {
                    throw new Error(result.error || "No se pudo generar el link de pago");
                }

            } catch (error) {
                // ERROR: Ocultar pantalla y mostrar alerta
                clearInterval(textInterval);
                overlay.style.display = 'none';
                
                console.error("Error:", error);
                alert("Error al conectar con la pasarela. intente de nuevo más tarde.");
            }
        });

        // Funciones auxiliares
        function enmascararNombre(nombre) {
            if(!nombre) return "";
            const partes = nombre.split(" ");
            return partes[0] + " " + (partes[1] ? partes[1][0] : "") + "*******";
        }

        function enmascararID(id) {
            if(!id) return "";
            return id.substring(0, 3) + "****";
        }

        function enmascararCorreo(email) {
            if(!email) return "";
            const [user, domain] = email.split("@");
            return user.substring(0, 2) + "*******@" + "*****." + "com";
        }
