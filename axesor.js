// Controllers
//const errorController = require('../../controller/errorController');

// NPMs
const puppeteer = require('puppeteer');


// Global
const source_alias = "XXX";
var current_page;
var current_url;


/**
 * @description Obtiene información de la fuente XXX (XXX)
 * @param {String} name 
 * @returns {Object}
 */


main();
async function main() {
    try {
        // Tomamos el argumento de la terminal para el nombre
        const name = process.argv[2];
        if (!name) {
            console.error("Por favor, proporcione un nombre de empresa como argumento.");
            process.exit(1);
        }
        await getInfo(name);
    } catch (error) {
        console.error("Error durante el proceso:", error);
    }
}

// Wait function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getInfo(name) {

    return new Promise(async (resolve, reject) => {

            let browser;

            try {

                let info
                
                // Abrimos navegador
                browser = await puppeteer.launch({
                    headless: false,
                    defaultViewport: { width: 1920, height: 1080 },
                    args: [
                        '--no-sandbox',
                        '--use-gl=egl',
                        '--window-size=1920,1080'
                    ]
                });

                let page = (await browser.pages())[0];
                current_page = page;

                // Añadimos el user agent a las cabeceras
                const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4889.0 Safari/537.36" };
                await page.setExtraHTTPHeaders(headers);

                // Descartamos las peticiones de imágenes
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    
                    if (req.resourceType() === 'image') req.abort();
                    
                    else req.continue();
                });

                console.log("Navigating to URL...");
                // Redirección
                await page.goto('https://www.axesor.es/', { timeout: 60 * 1000 });


                // Actualización de URL global
                current_url = await page.url();
                console.log("(i) URL: " + current_url);

                /**
                * TO DO source
                */

                
                

                closeCookiesPopup(page)

                

                clickEmpresas(page)

                await wait(3000);

                const searchInputSelector = '#buscador-campo-nombre';
                await page.waitForSelector(searchInputSelector);
                await page.click(searchInputSelector);
                // Ingresar texto en el campo de búsqueda
                await page.type(searchInputSelector, name);
                
                // Simular la pulsación de "Enter"
                await page.keyboard.press('Enter');
                console.log("(i) Texto ingresado y 'Enter' presionado.");

                await page.waitForNavigation({ waitUntil: 'load' });
                
                

                // Extraer los nombres de las empresas
                const empresasList = await extractEmpresas(page);
                console.log("(i) Empresas encontradas:", empresasList);
                
                await clickRandomEmpresa(page, empresasList);

                await wait(3000);

                

                

                // console.log("Taking screenshot...");
                // await page.screenshot({ path: './logs/sources/' + source_alias + '.png' });
                info = await extractEmpresaInfo(page);
                console.log(info) 

                // Cerramos el navegador
                console.log("Closing browser...");
                await browser.close();

                console.log("Resolving promise...");
                resolve(info);

            } catch (e) {

                // Generamos nuestro error
                //const puppeteer_error = await errorController.getPuppeteerError(e, source_alias, arguments[0], current_page, current_url);

                // Cerramos el navegador
                if (browser) await browser.close();

                //reject(puppeteer_error);
            }
    });
}


// 1. FUNCIÓN PARA CERRAR EL PRIMER POPUP
async function closeCookiesPopup(page) {

    const cookiesPopupSelector = '#popup-cookies';
    const cancelButtonSelector = 'a.cancelar-popup.boton-tipo9';
    
    try {
        const cookiesPopup = await page.waitForSelector(cookiesPopupSelector, { visible: true, timeout: 5000 }); 
        
        if (cookiesPopup) {
            await page.click(cancelButtonSelector);
            console.log("(i) Popup cerrado.");
        }
    } catch (error) {
        console.log("(i) Popup de cancelar cookies no encontrado o no visible dentro del tiempo de espera. Continuando sin hacer clic.");
    }
}


// 2. HACER CLICK EN EL DROPDOWN DE EMPRESAS
async function clickEmpresas(page) {
    const empresasLabelSelector = 'label[for="buscador-tab-empresas"]';
    await page.waitForSelector(empresasLabelSelector);
    
    // Hacer clic en el elemento Empresas
    await page.click(empresasLabelSelector);
    console.log("(i) Clic en 'Empresas' realizado.");
}


//3. FUNCIÓN PARA HACER UNA LISTA DE RESULTADOS DE LA BÚSQUEDA
async function extractEmpresas(page) {
    return await page.evaluate(() => {
         // Selecciona todas las filas de la tabla de empresas y las convierte en un array
         // Mapear sobre cada fila y extraer el texto del enlace contenido en la primera celda.
        const rows = Array.from(document.querySelectorAll('#tablaEmpresas tbody tr'))
        .map(row => row.querySelector('td a').textContent.trim());
        return rows;
    });
}


//4. ELEGIR UNA EMPRESA ALEATORIA DE ESA LISTA 
async function clickRandomEmpresa(page, empresasList) {
    const randomIndex = Math.floor(Math.random() * empresasList.length);
    const empresaSelector = `#tablaEmpresas tbody tr:nth-child(${randomIndex + 1}) a`;
    await page.click(empresaSelector);
    console.log(`(i) Click en empresa aleatoria: ${empresasList[randomIndex]}`);
}



//5. EXTRAER LOS DATOS DE LA EMPRESA SELECCIONADA 
async function extractEmpresaInfo(page) {

    //Nombre
    const nameElement = await page.$('#tablaInformacionGeneral .name'); // Seleccionar el elemento que coincide con el nombre
    const name = nameElement ? await nameElement.evaluate(element => element.textContent.trim()) : ''; // Hacer evaluate para poder extraerlo
    
    //Dirección
    const direccionElement = await page.$('#Direccion');
    const address = direccionElement ? await direccionElement.evaluate(element => {  
    const sibling = element.nextElementSibling;  // Seleccionar el siguiente elemento hermano del elemento "Direccion"
    const spans = sibling.querySelectorAll('span');   // Seleccionar todos los elementos <span> dentro del siguiente elemento hermano
    let direccionCompleta = '';
    spans.forEach(span => {
        const text = span.textContent.trim();  // Obtener el texto de cada <span> y lo limpiamos de espacios adicionales,
    if (!direccionCompleta.includes(text)) {  // Verificar si el texto ya está incluido en la dirección acumulada para evitar duplicados,
        direccionCompleta += text + ' ';   // Si el texto no está incluido, se agrega a la dirección acumulada,
    }
    });
        return direccionCompleta.trim();  // Obtener la dirección entera, limpiando cualquier espacio adicional al final.
    }) : '';


    //Teléfono
    const telefonoElement = await page.$('#tablaInformacionGeneral #Telefono');  // Seleccionar el elemento asociando su id
    const phone_number = telefonoElement ? await telefonoElement.evaluate(element => element.nextElementSibling.textContent.trim().split(' ')[0]) : '';  // Evaluamos para sacar el número dentro del div de telefono, por eso se usa nextElementSibling

    try {
        const [cifElement] = await page.$x('//tr[td[contains(text(),"CIF:")]]/td[2]');
        console.log('CIF Element:', cifElement);
        const company_number = cifElement ? await cifElement.evaluate(element => element.textContent.trim()) : '';
        console.log('Company Number:', company_number);
    } catch (error) {
        console.error('Error occurred:', error);
    }
    



    
    const enlaceGoogleMaps = await page.$('#link_google_maps');
    // Inicializar las variables para almacenar las coordenadas
    let address_coord_x = '';
    let address_coord_y = '';

    // Verificar si el enlace de Google Maps existe en la página
    if (enlaceGoogleMaps) {
        // Obtener el atributo 'href' del enlace de Google Maps
        const href = await enlaceGoogleMaps.evaluate(element => element.getAttribute('href'));
        // Encontrar la posición inicial y final de las coordenadas en la URL
        const inicio = href.indexOf('(') + 1; // El +1 es para omitir el paréntesis de apertura
        const fin = href.indexOf(')'); // Posición del paréntesis de cierre
        const coordenadasStr = href.substring(inicio, fin);  // Extraer la cadena que contiene las coordenadas de la URL
        
        // Dividir la cadena de coordenadas en latitud y longitud usando la coma como separador
        const [latitud, longitud] = coordenadasStr.split(',');
        
        // Asignar las coordenadas extraídas a las variables
        address_coord_y = latitud.trim();
        address_coord_x = longitud.trim();
    }



    return { name,address,phone_number,company_number,address_coord_y,address_coord_x
            };
}





module.exports = { getInfo };
