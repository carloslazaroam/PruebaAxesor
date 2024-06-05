// Controllers
const errorController = require('../../controller/errorController');

// NPMs
const puppeteer = require('puppeteer');

// Global
const source_alias = "XXX";
var current_page;
var current_url;


/**
 * @description Obtiene información de la fuente XXX (XXX)
 * @param {String} XXX 
 * @returns {Object}
 */
async function getInfo(XXX) {

      return new Promise(async (resolve, reject) => {

            let browser;

            try {

                  let info;

                  // Abrimos navegador
                  browser = await puppeteer.launch({
                        headless: true,
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

                  // Redirección
                  await page.goto(url, { timeout: 60 * 1000 });

                  // Actualización de URL global
                  current_url = await page.url();
                  console.log("(i) URL: " + current_url);

                  /**
                   * TO DO source
                   */

                  // Se genera un PNG con un pantallazo para comprobar que se cargo antes de cerrar
                  await page.screenshot({ path: './logs/sources/' + source_alias + '.png' });

                  // Cerramos el navegador
                  await browser.close();

                  resolve(info);

            } catch (e) {

                  // Generamos nuestro error
                  const puppeteer_error = await errorController.getPuppeteerError(e, source_alias, arguments[0], current_page, current_url);

                  // Cerramos el navegador
                  if (browser) await browser.close();

                  reject(puppeteer_error);

            }

      });

}

module.exports = { getInfo };