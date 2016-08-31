/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

function p_comprobar_numero_cedula(cedula) {

    if (typeof(cedula) == 'string' && cedula.length == 10 && /^\d+$/.test(cedula)) {
        var digitos = cedula.split('').map(Number);
        var codigo_provincia = digitos[0] * 10 + digitos[1];

        if (codigo_provincia >= 1 && codigo_provincia <= 24 && digitos[2] < 6) {
            var digito_verificador = digitos.pop();

            var digito_calculado = digitos.reduce(function(valorPrevio, valorActual, indice) {
                return valorPrevio - (valorActual * (2 - indice % 2)) % 9 - (valorActual == 9) * 9;
            }, 1000) % 10;

            return (digito_calculado === digito_verificador);
        }
    }
    return false;
}

$(document).ready(function() {

});


function p_calcular_digito_modulo11(numero) {
    var digito_calculado = -1;
    
    if (typeof(numero) == 'string' && /^\d+$/.test(numero)) {
        
        var digitos = numero.split('').map(Number); //arreglo con los dígitos del número

        digito_calculado = 11 - digitos.reduce(function(valorPrevio, valorActual, indice) {
            return valorPrevio + (valorActual * (7 - indice % 6));
        }, 0) % 11;
        
        digito_calculado = (digito_calculado == 11) ? 0 : digito_calculado; //según ficha técnica
        digito_calculado = (digito_calculado == 10) ? 1 : digito_calculado; //según ficha técnica
    }
    return digito_calculado;
}


//console.log('DIGITO CALCULADO:', p_calcular_digito_modulo11('031220140117223322590011000000000000000000000352'));


var p_obtener_secuencial = (function(tipo_comprobante) {
    
    function getRandomInt() {
        return Math.floor(Math.random() * (10000)) + 1;
    }
    
    tipo_comprobante = tipo_comprobante || 0;
    
    var secuencial = {
        0:1,
        1:1,
        4:1,
        5:1,
        6:1,
        7:1
    };
    return function() {
        return secuencial[tipo_comprobante]++;
        //return getRandomInt();
    }
})();
    

function p_obtener_codigo_autorizacion_desde_comprobante(comprobante) {
    var tipoComprobante = Object.keys(comprobante)[0];
    
    var codigoAutorizacion = p_obtener_codigo_autorizacion(
        moment(comprobante[tipoComprobante].infoFactura.fechaEmision, 'DD/MM/YYYY'), //fechaEmision
        tipoComprobante,//tipoComprobante
        comprobante[tipoComprobante].infoTributaria.ruc,//ruc
        comprobante[tipoComprobante].infoTributaria.ambiente,//ambiente
        comprobante[tipoComprobante].infoTributaria.estab,//estab
        comprobante[tipoComprobante].infoTributaria.ptoEmi,//ptoEmi
        comprobante[tipoComprobante].infoTributaria.secuencial,//secuencial
        null,//codigo
        comprobante[tipoComprobante].infoTributaria.tipoEmision//tipoEmision
        );
    
    return codigoAutorizacion;
}

function p_obtener_codigo_autorizacion(fechaEmision, tipoComprobante, ruc, ambiente, estab, ptoEmi, secuencial, codigo, tipoEmision) {
    fechaEmision = fechaEmision || new Date();
    tipoComprobante = tipoComprobante || 'factura'; //1 factura, 4 nota de crédito, 5 nota de débito, 6 guía de remisión, 7 retención
    ruc = ruc || '9999999999999';
    ambiente = ambiente || 1; // 1 pruebas, 2 produccion
    
    //serie = serie || 0;
    estab = estab || 1;
    ptoEmi = ptoEmi || 1;
    
    
    secuencial = secuencial || p_obtener_secuencial(tipoComprobante);
    codigo = codigo ||  (moment(fechaEmision).format('DDMM') + pad(secuencial, 4).slice(-3) + p_calcular_digito_modulo11(moment(fechaEmision).format('DDMM') + pad(secuencial, 3).slice(-3)));
    tipoEmision = tipoEmision ||  1; //1 emision normal
    
    var codigo_autorizacion = moment(fechaEmision).format('DDMMYYYY') 
                + pad(codDoc[tipoComprobante], 2) 
                + pad(ruc, 13) 
                + pad(ambiente, 1)
                + pad(estab, 3) + pad(ptoEmi, 3)
                + pad(secuencial, 9)
                + pad(codigo, 8)
                + pad(tipoEmision, 1);
                
    var digito_calculado = p_calcular_digito_modulo11(codigo_autorizacion);
    
    if (digito_calculado > -1) {
        return codigo_autorizacion + digito_calculado;
    }
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


var codDoc = {
    'factura':1,
    'comprobanteRetencion':7,
    'guiaRemision':6,
    'notaCredito':4,
    'notaDebito':5,
};

//console.log('codigo autorizacion: ', p_obtener_codigo_autorizacion().length);

function p_generar_factura_xml(){
    var estructuraFactura = {
        factura:{
            _id:"comprobante",
            _version:"1.0.0",
            infoTributaria:{
                ambiente:null,
                tipoEmision:null,
                razonSocial:null,
                nombreComercial:null,
                ruc:null,
                claveAcceso:null,
                codDoc:null,
                estab:null,
                ptoEmi:null,
                secuencial:null,
                dirMatriz:null,
            },
            infoFactura:{
                fechaEmision:null,
                dirEstablecimiento:null,
                contribuyenteEspecial:null,
                obligadoContabilidad:null,
                tipoIdentificacionComprador:null,
                guiaRemision:null,
                razonSocialComprador:null,
                identificacionComprador:null,
                direccionComprador:null,
                totalSinImpuestos:null,
                totalDescuento:null,
                totalConImpuestos:{
                    totalImpuesto:[
                    {
                        codigo:2,
                        codigoPorcentaje:2,
                        //descuentoAdicional:null,
                        baseImponible:null,
                        valor:null,
                    },
                    {
                        codigo:3,
                        codigoPorcentaje:3072,
                        baseImponible:null,
                        valor:null,
                    },
                    {
                        codigo:5,
                        codigoPorcentaje:5001,
                        baseImponible:null,
                        valor:null,
                    }
                    ]
                },
                propina:null,
                importeTotal:null,
                moneda:null,
            },
            detalles:{
                detalle:[
                {
                    codigoPrincipal:null, //opcional
                    codigoAuxiliar:null, //obliatorio cuando corresponda
                    descripcion:null,
                    cantidad:null,
                    precioUnitario:null,
                    descuento:null,
                    precioTotalSinImpuesto:null,
                    detallesAdicionales:{
                        detAdicional:[
                            {
                                _nombre:"",
                                _valor:""
                            }
                            //<detAdicional nombre="Marca Chevrolet" valor="Chevrolet"/>
                        ]
                    },
                        
                    impuestos:{
                        impuesto:[
                        {
                            codigo:2,
                            codigoPorcentaje:2,
                            tarifa:12,
                            baseImponible:null,
                            valor:null
                        },
                        {
                            codigo:3,
                            codigoPorcentaje:3072,
                            tarifa:5,
                            baseImponible:null,
                            valor:null
                        },
                        {
                            codigo:5,
                            codigoPorcentaje:5001,
                            tarifa:0.02,
                            baseImponible:null,
                            valor:null
                        }
                        ]
                    }
                }
                ]
            },
            infoAdicional:{
                campoAdicional:[
                {
                    _nombre:"Codigo Impuesto ISD",
                    __text:4580
                },
                {
                    _nombre:"Impuesto ISD",
                    __text:"15.42x"
                }
                    //<campoAdicional nombre="Codigo Impuesto ISD">4580</campoAdicional> //Obligatorio cuando corresponda
                    //<campoAdicional nombre="Impuesto ISD">15.42x</campoAdicional> //Obligatorio cuando corresponda
                ]
            }
        }
    };
    
    var tipoComprobante = 'factura';
    var estab = 1;
    var ptoEmi = 1;

    estructuraFactura[tipoComprobante].infoTributaria.ambiente = 1; //1 pruebas, 2 produccion
    estructuraFactura[tipoComprobante].infoTributaria.tipoEmision = 1; //1 emision normal
    estructuraFactura[tipoComprobante].infoTributaria.razonSocial = 'JYBARO SOFTWARE HOUSE CIA LTDA';
    estructuraFactura[tipoComprobante].infoTributaria.nombreComercial = 'JYBARO SOFTWARE HOUSE CIA LTDA';
    estructuraFactura[tipoComprobante].infoTributaria.ruc = '1792521254001';
    estructuraFactura[tipoComprobante].infoTributaria.claveAcceso = ''; //se lo llena más abajo
    estructuraFactura[tipoComprobante].infoTributaria.codDoc = pad(codDoc[tipoComprobante], 2); //tipo de comprobante
    estructuraFactura[tipoComprobante].infoTributaria.estab = pad(estab, 3);
    estructuraFactura[tipoComprobante].infoTributaria.ptoEmi = pad(ptoEmi, 3);
    estructuraFactura[tipoComprobante].infoTributaria.secuencial = pad(p_obtener_secuencial(codDoc[tipoComprobante]), 9);
    estructuraFactura[tipoComprobante].infoTributaria.dirMatriz = 'Carapungo Av. Luis Vacarri B9 S29 y Carihuairazo';
    
    
    estructuraFactura[tipoComprobante].infoFactura.fechaEmision = moment().format('DD/MM/YYYY');
    estructuraFactura[tipoComprobante].infoFactura.dirEstablecimiento = 'Carapungo B9-S29';
    estructuraFactura[tipoComprobante].infoFactura.contribuyenteEspecial = '5368';
    estructuraFactura[tipoComprobante].infoFactura.obligadoContabilidad = 'SI';
    estructuraFactura[tipoComprobante].infoFactura.tipoIdentificacionComprador = pad(4, 2);
    estructuraFactura[tipoComprobante].infoFactura.guiaRemision = '001-001-000000001';
    estructuraFactura[tipoComprobante].infoFactura.razonSocialComprador = 'PRUEBAS SERVICIO DE RENTAS INTERNAS';
    estructuraFactura[tipoComprobante].infoFactura.identificacionComprador = '1713328506001';
    estructuraFactura[tipoComprobante].infoFactura.direccionComprador = 'salinas y santiago';
    estructuraFactura[tipoComprobante].infoFactura.totalSinImpuestos = '2995000.00';
    estructuraFactura[tipoComprobante].infoFactura.totalDescuento = '5000.00';
        

    estructuraFactura[tipoComprobante].infoFactura.totalConImpuestos.totalImpuesto[0].baseImponible = '309750.00';
    estructuraFactura[tipoComprobante].infoFactura.totalConImpuestos.totalImpuesto[0].valor = '37170.00';

    estructuraFactura[tipoComprobante].infoFactura.totalConImpuestos.totalImpuesto[1].baseImponible = '295000.00';
    estructuraFactura[tipoComprobante].infoFactura.totalConImpuestos.totalImpuesto[1].valor = '14750.00';
    
    estructuraFactura[tipoComprobante].infoFactura.totalConImpuestos.totalImpuesto[2].baseImponible = '12000.00';
    estructuraFactura[tipoComprobante].infoFactura.totalConImpuestos.totalImpuesto[2].valor = '240.00';
    
    estructuraFactura[tipoComprobante].infoFactura.propina = '0.00';
    estructuraFactura[tipoComprobante].infoFactura.importeTotal = '3371160.00';
    estructuraFactura[tipoComprobante].infoFactura.moneda = 'DOLAR';    
    
    estructuraFactura[tipoComprobante].infoTributaria.claveAcceso = p_obtener_codigo_autorizacion_desde_comprobante(estructuraFactura);
    
    
    estructuraFactura[tipoComprobante].detalles.detalle[0].codigoPrincipal = '125BJC-01';
    estructuraFactura[tipoComprobante].detalles.detalle[0].codigoAuxiliar = '1234D56789-A';
    estructuraFactura[tipoComprobante].detalles.detalle[0].descripcion = 'CAMIONETA 4X4 DIESEL 3.7';
    estructuraFactura[tipoComprobante].detalles.detalle[0].cantidad = '10.00';
    estructuraFactura[tipoComprobante].detalles.detalle[0].precioUnitario = '300000.00';
    estructuraFactura[tipoComprobante].detalles.detalle[0].descuento = '5000.00';
    estructuraFactura[tipoComprobante].detalles.detalle[0].precioTotalSinImpuesto = '295000.00';
    
    estructuraFactura[tipoComprobante].detalles.detalle[0].detallesAdicionales.detAdicional[0]._nombre = 'Marca Chevrolet';
    estructuraFactura[tipoComprobante].detalles.detalle[0].detallesAdicionales.detAdicional[0]._valor = 'Chevrolet';
    
   
    estructuraFactura[tipoComprobante].detalles.detalle[0].impuestos.impuesto[0].baseImponible = '309750.00';
    estructuraFactura[tipoComprobante].detalles.detalle[0].impuestos.impuesto[0].valor = '361170.00';
    
    estructuraFactura[tipoComprobante].detalles.detalle[0].impuestos.impuesto[1].baseImponible = '295000.00';
    estructuraFactura[tipoComprobante].detalles.detalle[0].impuestos.impuesto[1].valor = '14750.00';
    

    estructuraFactura[tipoComprobante].detalles.detalle[0].impuestos.impuesto[2].baseImponible = '12000.00';
    estructuraFactura[tipoComprobante].detalles.detalle[0].impuestos.impuesto[2].valor = '240.00';
    
    
    var x2js = new X2JS({useDoubleQuotes:true});
    
    var xmlAsStr = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlAsStr += x2js.json2xml_str(estructuraFactura);
    
    return xmlAsStr;
}

var path = ""

//console.log('XML: ', p_generar_factura_xml());

saveFile_noui(p_generar_factura_xml(), 'factura-'+moment().format('YYYYMMDD-hhmm')+'.xml', p_firmar_factura);
    
function p_firmar_factura(path) {
    openFile(path, function(factura) {
        
        p_generar_xades_bes(factura, function(factura_firmada, claveAcceso){
            //console.log('factura_firmada:', factura_firmada);
            //console.log('base 64 de factura firmada: ', forge.util.encode64(factura_firmada));
            p_('xml').value = forge.util.encode64(factura_firmada);
            p_('xmlcodigo').value = claveAcceso;
            p_('factura').value = factura;
            p_('factura_firmada').value = factura_firmada;
        });
        
    });

}

function sha1_base64(txt) {
    var md = forge.md.sha1.create();
    md.update(txt);
    return new Buffer(md.digest().toHex(), 'hex').toString('base64');
}

function p_generar_xades_bes(factura, callback){

    $.post({
        url: 'http://www.senescyt.gob.ec/web/guest/consultas/titulos',
        data: {
            apellidos:'',
            identificacion:'1706742929'
        },
        success: function(result){
            $('#senescyt').html(result);

        },     
        error: function(result){
            alert('ERROR: '+ result);


        }
   });


    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(factura,"text/xml");
    var claveAcceso = xmlDoc.getElementsByTagName("claveAcceso")[0].childNodes[0].nodeValue;


    var p12_path = "/home/yop/edgar_patricio_valarezo_vargas.p12";
    var p12xxx = new File(p12_path, 'binary');
    
    var pwdCert = '1234567890';
    
    generarFirma(p12xxx, factura, pwdCert, function(firma, certificado, modulus, firma_pem, certificado_pem, modulus_pem, certificateX509_der_hash, X509SerialNumber, exponent) {

        var sha1_factura = sha1_base64(factura.replace('<?xml version="1.0" encoding="UTF-8"?>\n', ''));

        var xmlns = 'xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"';
        
        
        //numeros involucrados en los hash:
        var Certificate_number = p_obtener_aleatorio(); //1562780 en el ejemplo del SRI
        var Signature_number = p_obtener_aleatorio(); //620397 en el ejemplo del SRI
        var SignedProperties_number = p_obtener_aleatorio(); //24123 en el ejemplo del SRI
        
        //numeros fuera de los hash:
        var SignedInfo_number = p_obtener_aleatorio(); //814463 en el ejemplo del SRI
        var SignedPropertiesID_number = p_obtener_aleatorio(); //157683 en el ejemplo del SRI
        var Reference_ID_number = p_obtener_aleatorio(); //363558 en el ejemplo del SRI
        var SignatureValue_number = p_obtener_aleatorio(); //398963 en el ejemplo del SRI
        var Object_number = p_obtener_aleatorio(); //231987 en el ejemplo del SRI
        
        


        var SignedProperties = '';

        SignedProperties += '<etsi:SignedProperties Id="Signature' + Signature_number + '-SignedProperties' + SignedProperties_number + '">';  //SignedProperties
            SignedProperties += '<etsi:SignedSignatureProperties>';
                SignedProperties += '<etsi:SigningTime>';

                    SignedProperties += moment().format('YYYY-MM-DD\THH:mm:ssZ');
                    
                SignedProperties += '</etsi:SigningTime>';
                SignedProperties += '<etsi:SigningCertificate>';
                    SignedProperties += '<etsi:Cert>';
                        SignedProperties += '<etsi:CertDigest>';
                            SignedProperties += '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
                            SignedProperties += '</ds:DigestMethod>';
                            SignedProperties += '<ds:DigestValue>';

                                SignedProperties += certificateX509_der_hash;

                            SignedProperties += '</ds:DigestValue>';
                        SignedProperties += '</etsi:CertDigest>';
                        SignedProperties += '<etsi:IssuerSerial>';
                            SignedProperties += '<ds:X509IssuerName>';
                                SignedProperties += 'CN=AC BANCO CENTRAL DEL ECUADOR,L=QUITO,OU=ENTIDAD DE CERTIFICACION DE INFORMACION-ECIBCE,O=BANCO CENTRAL DEL ECUADOR,C=EC';
                            SignedProperties += '</ds:X509IssuerName>';
                        SignedProperties += '<ds:X509SerialNumber>';
                        
                            SignedProperties += X509SerialNumber;
                            
                        SignedProperties += '</ds:X509SerialNumber>';
                        SignedProperties += '</etsi:IssuerSerial>';
                    SignedProperties += '</etsi:Cert>';
                SignedProperties += '</etsi:SigningCertificate>';
            SignedProperties += '</etsi:SignedSignatureProperties>';
            SignedProperties += '<etsi:SignedDataObjectProperties>';
                SignedProperties += '<etsi:DataObjectFormat ObjectReference="#Reference-ID-' + Reference_ID_number + '">';
                    SignedProperties += '<etsi:Description>';
                        
                        SignedProperties += 'contenido comprobante';                        

                    SignedProperties += '</etsi:Description>';
                    SignedProperties += '<etsi:MimeType>';
                        SignedProperties += 'text/xml';
                    SignedProperties += '</etsi:MimeType>';
                SignedProperties += '</etsi:DataObjectFormat>';
            SignedProperties += '</etsi:SignedDataObjectProperties>';
        SignedProperties += '</etsi:SignedProperties>'; //fin SignedProperties
        
        
        SignedProperties_para_hash = SignedProperties.replace('<etsi:SignedProperties', '<etsi:SignedProperties ' + xmlns);

        var sha1_SignedProperties = sha1_base64(SignedProperties_para_hash);        
        

        var KeyInfo = '';
            
        KeyInfo += '<ds:KeyInfo Id="Certificate' + Certificate_number + '">';
            KeyInfo += '\n<ds:X509Data>';
                KeyInfo += '\n<ds:X509Certificate>\n';

                    //CERTIFICADO X509 CODIFICADO EN Base64 
                    KeyInfo += certificado;

                KeyInfo += '\n</ds:X509Certificate>';
            KeyInfo += '\n</ds:X509Data>';
            KeyInfo += '\n<ds:KeyValue>';
                KeyInfo += '\n<ds:RSAKeyValue>';
                    KeyInfo += '\n<ds:Modulus>\n';

                        //MODULO DEL CERTIFICADO X509
                        KeyInfo += modulus;

                    KeyInfo += '\n</ds:Modulus>';
                    KeyInfo += '\n<ds:Exponent>';
                    
                        //KeyInfo += 'AQAB';
                        KeyInfo += exponent;
                        
                    KeyInfo += '</ds:Exponent>';
                KeyInfo += '\n</ds:RSAKeyValue>';
            KeyInfo += '\n</ds:KeyValue>';
        KeyInfo += '\n</ds:KeyInfo>';
        
        KeyInfo_para_hash = KeyInfo.replace('<ds:KeyInfo', '<ds:KeyInfo ' + xmlns);

        var sha1_certificado = sha1_base64(KeyInfo_para_hash);


        var SignedInfo = '';
        
        SignedInfo += '<ds:SignedInfo Id="Signature-SignedInfo' + SignedInfo_number + '">';
            SignedInfo += '\n<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315">';
            SignedInfo += '</ds:CanonicalizationMethod>';
            SignedInfo += '\n<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1">';
            SignedInfo += '</ds:SignatureMethod>';
            SignedInfo += '\n<ds:Reference Id="SignedPropertiesID' + SignedPropertiesID_number + '" Type="http://uri.etsi.org/01903#SignedProperties" URI="#Signature' + Signature_number + '-SignedProperties' + SignedProperties_number + '">';
                SignedInfo += '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
                SignedInfo += '</ds:DigestMethod>';
                SignedInfo += '\n<ds:DigestValue>';

                    //HASH O DIGEST DEL ELEMENTO <etsi:SignedProperties>';
                    SignedInfo += sha1_SignedProperties;

                SignedInfo += '</ds:DigestValue>';
            SignedInfo += '\n</ds:Reference>';
            SignedInfo += '\n<ds:Reference URI="#Certificate' + Certificate_number + '">';
                SignedInfo += '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
                SignedInfo += '</ds:DigestMethod>';
                SignedInfo += '\n<ds:DigestValue>';

                    //HASH O DIGEST DEL CERTIFICADO X509
                    SignedInfo += sha1_certificado;

                SignedInfo += '</ds:DigestValue>';
            SignedInfo += '\n</ds:Reference>';
            SignedInfo += '\n<ds:Reference Id="Reference-ID-' + Reference_ID_number + '" URI="#comprobante">';
                SignedInfo += '\n<ds:Transforms>';
                    SignedInfo += '\n<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature">';
                    SignedInfo += '</ds:Transform>';
                SignedInfo += '\n</ds:Transforms>';
                SignedInfo += '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
                SignedInfo += '</ds:DigestMethod>';
                SignedInfo += '\n<ds:DigestValue>';

                    //HASH O DIGEST DE TODO EL ARCHIVO XML IDENTIFICADO POR EL id="comprobante" 
                    SignedInfo += sha1_factura;

                SignedInfo += '</ds:DigestValue>';
            SignedInfo += '\n</ds:Reference>';
        SignedInfo += '\n</ds:SignedInfo>';
        
        SignedInfo_para_firma = SignedInfo.replace('<ds:SignedInfo', '<ds:SignedInfo ' + xmlns);
        
        p_firmar(p12xxx, SignedInfo_para_firma, pwdCert, function(firma_SignedInfo){
            
            var xades_bes = '';
            

            //INICIO DE LA FIRMA DIGITAL 
            xades_bes += '<ds:Signature ' + xmlns + ' Id="Signature' + Signature_number + '">';
                xades_bes += '\n' + SignedInfo;

                xades_bes += '\n<ds:SignatureValue Id="SignatureValue' + SignatureValue_number + '">\n';

                    //VALOR DE LA FIRMA (ENCRIPTADO CON LA LLAVE PRIVADA DEL CERTIFICADO DIGITAL) 
                    xades_bes += firma_SignedInfo;

                xades_bes += '\n</ds:SignatureValue>';

                xades_bes += '\n' + KeyInfo;

                xades_bes += '\n<ds:Object Id="Signature' + Signature_number + '-Object' + Object_number + '">';
                    xades_bes += '<etsi:QualifyingProperties Target="#Signature' + Signature_number + '">';

                        //ELEMENTO <etsi:SignedProperties>';
                        xades_bes += SignedProperties;

                    xades_bes += '</etsi:QualifyingProperties>';
                xades_bes += '</ds:Object>';
            xades_bes += '</ds:Signature>';

            //FIN DE LA FIRMA DIGITAL 


            callback(factura.replace('</factura>', xades_bes + '</factura>'), claveAcceso);

        });

    });
}

var forge = require('node-forge');

function generarFirma(p12File, infoAFirmar, pwdCert, callback2) {
    var pemMessagep7 = '', certificateX509 = '';
    
    if (p12File !== undefined && infoAFirmar !== undefined) {
        var reader = new FileReader();
        var arrayBuffer = null;
        var resultReader = null;

        reader.readAsArrayBuffer(p12File);

        reader.onloadend = function () {
            arrayBuffer = reader.result;
            var arrayUint8 = new Uint8Array(arrayBuffer);;
            var p12Der = forge.util.decode64(p12B64);
            var p12Asn1 = forge.asn1.fromDer(p12Der);
            
            var p12 = null;

            p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pwdCert);

            var certBags = p12.getBags({bagType:forge.pki.oids.certBag})
            var cert = certBags[forge.oids.certBag][0].cert;
            var pkcs8bags = p12.getBags({bagType:forge.pki.oids.pkcs8ShroudedKeyBag});
            var pkcs8 = pkcs8bags[forge.oids.pkcs8ShroudedKeyBag][0];
            var key = pkcs8.key;
            
            if( key == null ) {
                key = pkcs8.asn1;
            }

            var md = forge.md.sha1.create();
            md.update(infoAFirmar, 'utf8');
            var signature = btoa(key.sign(md)).match(/.{1,76}/g).join("\n");

            certificateX509_pem = forge.pki.certificateToPem(cert);

            certificateX509 = certificateX509_pem;
            certificateX509 = certificateX509.substr( certificateX509.indexOf('\n') );
            certificateX509 = certificateX509.substr( 0, certificateX509.indexOf('\n-----END CERTIFICATE-----') );

            certificateX509 = certificateX509.replace(/\r?\n|\r/g, '').replace(/([^\0]{76})/g, '$1\n');

            //Pasar certificado a formato DER y sacar su hash:
            certificateX509_asn1 = forge.pki.certificateToAsn1(cert);
            certificateX509_der = forge.asn1.toDer(certificateX509_asn1).getBytes();
            certificateX509_der_hash = sha1_base64(certificateX509_der);
            
            //Serial Number
            var X509SerialNumber = parseInt(cert.serialNumber, 16);

            exponent = hexToBase64(key.e.data[0].toString(16));            
            modulus_pem = modulus = bigint2base64(key.n);


            callback2(signature, certificateX509, modulus, signature, certificateX509_pem, modulus_pem, certificateX509_der_hash, X509SerialNumber, exponent);
        }
    } else {
        if ($.isEmptyObject(p12File) ) {
            var msg = "Debe seleccionar el archivo de certificado digital (.p12)";
            console.error(msg);
        }

        if ($.isEmptyObject(infoAFirmar) ) {
            var msg = "No existe informacion a firmar";
            console.error(msg);
        }
    }
    
    return pemMessagep7;
}



function bigint2base64(bigint){
    var base64 = '';
    base64 = btoa(bigint.toString(16).match(/\w{2}/g).map(function(a){return String.fromCharCode(parseInt(a, 16));} ).join(""));
    
    base64 = base64.match(/.{1,76}/g).join("\n");
    
    return base64;
}


function p_firmar(p12File, infoAFirmar, pwdCert, callback){
    var reader = new FileReader();
    var arrayBuffer = null;
    var resultReader = null;
    var signature = '';

    reader.readAsArrayBuffer(p12File);

    reader.onloadend = function () {
        arrayBuffer = reader.result;
        var arrayUint8 = new Uint8Array(arrayBuffer);
        var p12B64 = forge.util.binary.base64.encode(arrayUint8);
        var p12Der = forge.util.decode64(p12B64);
        var p12Asn1 = forge.asn1.fromDer(p12Der);

        var p12 = null;

        p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pwdCert);

        var pkcs8bags = p12.getBags({bagType:forge.pki.oids.pkcs8ShroudedKeyBag});
        var pkcs8 = pkcs8bags[forge.oids.pkcs8ShroudedKeyBag][0];
        var key = pkcs8.key;
        if( key == null ) {
            key = pkcs8.asn1;
        }


        var md = forge.md.sha1.create();
        md.update(infoAFirmar, 'utf8');
        signature = btoa(key.sign(md)).match(/.{1,76}/g).join("\n");
        
        callback(signature);
    };
    
    return;
}

function p_obtener_aleatorio() {
    return Math.floor(Math.random() * 999000) + 990;    
}


function hexToBase64(str) {
    var hex = ('00' + str).slice(0 - str.length - str.length % 2);
    
    return btoa(String.fromCharCode.apply(null,
        hex.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
    );
}
