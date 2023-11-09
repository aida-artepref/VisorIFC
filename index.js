import { Color, MeshLambertMaterial, MeshBasicMaterial, LineBasicMaterial, Mesh,  BoxHelper}  from 'three';
import{ IfcViewerAPI } from 'web-ifc-viewer';
import { IfcElementQuantity } from 'web-ifc';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

import { NavCube } from './NavCube/NavCube.js';

const container = document.getElementById('app');
const viewer = new IfcViewerAPI({container, backgroundColor: new Color("#E8D5D6")});
const scene = viewer.context.scene.scene;
viewer.clipper.active = true;
viewer.grid.setGrid(100,100);


const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

window.addEventListener("resize", () => {
  labelRenderer.setSize(viewer.clientWidth, viewer.clientHeight);
});

document.addEventListener("keydown", function(event) {
    if (event.keyCode === 116) { // keyCode 116 es la tecla F5
      event.preventDefault(); // evita que se procese 
    }
});

viewer.context.renderer.usePostproduction = true;
viewer.IFC.selector.defSelectMat.color = new Color('#d6e500');

const GUI={
    input: document.getElementById("file-input"),
    loader: document.getElementById("loader-button"),

    inputArteTipos: document.getElementById("file-input-arte-tipos"),
    loaderArteTipos: document.getElementById("loader-button-arte-tipos"),

    inputExt: document.getElementById("file-input-ext"),
    loaderExt: document.getElementById("loader-button-ext"),
    
}

//Muestra el nombre del archivo abierto
document.getElementById("file-input").addEventListener("change", function() {
    const file = this.files[0];
    document.getElementById("file-name").innerHTML = file.name;
    document.getElementById("file-name").style.display = "block"; 
});
document.getElementById("file-input-arte-tipos").addEventListener("change", function() {
  const file = this.files[0];
  document.getElementById("file-name").innerHTML = file.name;
  document.getElementById("file-name").style.display = "block"; 
});
document.getElementById("file-input-ext").addEventListener("change", function() {
  const file = this.files[0];
  document.getElementById("file-name").innerHTML = file.name;
  document.getElementById("file-name").style.display = "block"; 
});

const toggleFullScreen = () => {
  const appContainer = document.querySelector('.container'); // Reemplaza 'app-container' con el ID de tu contenedor principal

  if (document.fullscreenElement || document.webkitFullscreenElement) {
    // Si ya estamos en pantalla completa, salimos de ella
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } else {
    // Solicitamos entrar en pantalla completa en el elemento principal de tu app
    if (appContainer.requestFullscreen) {
      appContainer.requestFullscreen();
    } else if (appContainer.webkitRequestFullscreen) {
      appContainer.webkitRequestFullscreen();
    }
  }
};


GUI.loader.onclick = () => GUI.input.click();  //al hacer clic al boton abre cuadro de dialogo para cargar archivo
GUI.loaderArteTipos.onclick = () => GUI.inputArteTipos.click()
GUI.loaderExt.onclick = () => GUI.inputExt.click();
//GUI.loaderExt.addEventListener('click', toggleFullScreen);

//cada vez elemento imput cambia, genera uURL y lo pasa a la lib IFC
GUI.input.onchange = async (event) => {
    const file=event.target.files[0];
    const url=URL.createObjectURL(file);
    loadModel(url); 
}

GUI.inputExt.onchange = async (event) => {
  const file=event.target.files[0];
  const url=URL.createObjectURL(file);
  loadModelExt(url); 
}

GUI.inputArteTipos.onchange = async (event) => {
  const file=event.target.files[0];
  const url=URL.createObjectURL(file);
  loadModelArteTipos(url); 
}

let allPlans;
let model;
let allIDs;
let idsTotal;

let uniqueTypes=[];
let precastElements=[];
let subset;



async function loadModel(url) {
  model = await viewer.IFC.loadIfcUrl(url);
  console.log(model);

  const btnLoadIfcExt = document.getElementById('loader-button-ext');
  btnLoadIfcExt.style.display = 'none';
  const btnLoadIfcArtetipos = document.getElementById('loader-button-arte-tipos');
  btnLoadIfcArtetipos.style.display = 'none';
  getPlantas(model);

  precastElements = await createPrecastElementsArray(model.modelID);
  await cargaGlobalIdenPrecast(precastElements);
  
  await viewer.IFC.getSpatialStructure(model.modelID);
  await cargaProp();

  allIDs = getAllIds(model);
  idsTotal = getAllIds(model);
  viewer.shadows = true;
  creaBoxHelper();
  subset = getWholeSubset(viewer, model, allIDs);
  replaceOriginalModelBySubset(viewer, model, subset);
  visibleToolbar();
  viewer.context.fitToFrame();
  setTimeout(() => {
    agregarPropiedadesElementPart();
  }, 100); 

  setTimeout(() => {
    eliminarElementosAssembly();
  }, 100);
  
  const checkboxContainer = document.getElementById('checkbox-container');
  setTimeout(function() {
      checkboxContainer.innerHTML = generateCheckboxes(precastElements);
  }, 100);
  checkboxContainer.style.visibility = "visible"; 
  setTimeout(function() {
    addCheckboxListeners(precastElements, viewer);
  }, 100);
}

async function loadModelArteTipos(url) {
  model = await viewer.IFC.loadIfcUrl(url);
  console.log(model);

  const btnLoadIfcExt = document.getElementById('loader-button-ext');
  btnLoadIfcExt.style.display = 'none';
  getPlantas(model);

  precastElements = await createPrecastElementsArray(model.modelID);
 // await cargaGlobalIdenPrecast(precastElements);
  
  // await viewer.IFC.getSpatialStructure(model.modelID);
  // await cargaProp();

  allIDs = getAllIds(model);
  idsTotal = getAllIds(model);
  viewer.shadows = true;
  creaBoxHelper();
  subset = getWholeSubset(viewer, model, allIDs);
  replaceOriginalModelBySubset(viewer, model, subset);
  let btnArteMontaje = document.getElementById("loader-button")
  btnArteMontaje.style.display='none'
  let btnArteTipos = document.getElementById("loader-button-arte-tipos")
  btnArteTipos.style.top = '0.7rem';
  viewer.context.fitToFrame();
  
  viewer.shadows = true;
  creaBoxHelper();
  subset = getWholeSubset(viewer, model, allIDs);
  replaceOriginalModelBySubset(viewer, model, subset);
  visibleToolbar();
  const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID); //ifcProyect parametro necesario para obtener los elementos de IFC del modelo
    setIfcPropertiesContent(ifcProject, viewer, model);
    document.getElementById("checktiposIfc").style.display = "block"; //hace visible el divCheck 
    setTimeout(function() {
      addCheckboxListenersExt(precastElements, viewer);
    }, 1000);
}

async function loadModelExt(url) {
  model = await viewer.IFC.loadIfcUrl(url);
  console.log(model);

  const btnLoadIfcArt = document.getElementById('loader-button');
  btnLoadIfcArt.style.display = 'none';
  const btnLoadIfcArtetipos = document.getElementById('loader-button-arte-tipos');
  btnLoadIfcArtetipos.style.display = 'none';

  const btnLoadIfcExt = document.getElementById('loader-button-ext');
  btnLoadIfcExt.style.top = '0.7rem';
  allIDs = getAllIds(model);
  idsTotal = getAllIds(model);
  precastElements = await createPrecastElementsArray(model.modelID);
  viewer.shadows = true;
  creaBoxHelper();
  subset = getWholeSubset(viewer, model, allIDs);
  replaceOriginalModelBySubset(viewer, model, subset);
  visibleToolbar();
  const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID); //ifcProyect parametro necesario para obtener los elementos de IFC del modelo
    setIfcPropertiesContent(ifcProject, viewer, model);
    document.getElementById("checktiposIfc").style.display = "block"; //hace visible el divCheck 
    setTimeout(function() {
      addCheckboxListenersExt(precastElements, viewer);
    }, 1000);
}


function visibleToolbar(){
  const toolbarElement = document.querySelector('.toolbar');
  toolbarElement.style.visibility = 'visible';
}
const rejilla = document.getElementById('btn-ver-rejilla');

function toggleRejilla() {
    rejilla.classList.toggle('active');

    if (rejilla.classList.contains('active')) {
        viewer.grid.setGrid(100, 100);
    } else {
        viewer.grid.dispose();
    }
}

rejilla.addEventListener('click', toggleRejilla);



// TODO: -------------- carga modelo ArtePref con mucha informacion y crea array precastElements --------------------------------------------
async function createPrecastElementsArray(modelID){
  const ifcProject = await viewer.IFC.getSpatialStructure (modelID);
  
  const constructPrecastElements = (node) => {
      const children = node.children;
      const exists = uniqueTypes.includes(node.type);
      //elementos de IFC excluidos BUILDING y SITE UNIONES ELIMINADAS DE ARRAY
      if (!exists && node.type !== "IFCBUILDING" && node.type !== "IFCSITE" && node.type !== "IFCBUILDINGSTOREY" && node.type !== "IFCBUILDINGELEMENTPROXY"  ) {
          precastElements.push({expressID: node.expressID, ifcType: node.type});
      }
      if(children.length === 0){
          return;    
      }
      children.forEach(child => {
          constructPrecastElements(child);
      }); 
  }
  ifcProject.children.forEach(child => {
      constructPrecastElements(child)
  })
  return precastElements;
}

async function cargaGlobalIdenPrecast(){
  //Carga la propiedade GlobalId al array precastElements
      precastElements.forEach(precast => {
          if (precast.ifcType !='IFCBUILDING'){
              precastPropertiesGlobalId(precast, 0, precast.expressID);
          }
      }); 
      
}

async function cargaProp() {await new Promise(resolve => {
  // Carga las propiedades/psets al array
  precastElements.forEach(precast => {
      if (precast.ifcType != 'IFCBUILDING' && precast.ifcType != 'IFCBUILDINGELEMENTPART') {
          precastProperties(precast, 0, precast.expressID);
      }
  });
  resolve();
});
}

async function precastProperties(precast,modelID, precastID){
  const props = await viewer.IFC.getProperties(modelID, precastID, true, true);

  const mats =props.mats;
  const psets =props.psets;
  const type= props.type;


  delete props.mats;
  delete props.psets;
  delete props.type;
  
  for (let pset in psets){
      psetName = psets[pset].Name.value;
      let properties = psets[pset].HasProperties;
      if (psets[pset] !== IfcElementQuantity){
          
          for (let property in properties){
              if (properties[property].Name.value.includes('Cami')){
                  precast['Camion']=properties[property].NominalValue.value;
              } else if (properties[property].Name.value.includes('Produc')){
                  precast['Produccion']=properties[property].NominalValue.value;
              } else if (properties[property].Name.value.includes('Volum')){   
                 // precast[properties[property].Name.value] = parseFloat(properties[property].NominalValue.value).toFixed(3);
                  const volumenCadena = String(properties[property].NominalValue.value);
                  const volumen = parseFloat(volumenCadena.replace(",", "."));
                  precast[properties[property].Name.value] = volumen;
              } else {
                  precast[properties[property].Name.value] = properties[property].NominalValue.value;
              }
          }
      }
  }
}

async function precastPropertiesGlobalId(precast,modelID, precastID){
  const props = await viewer.IFC.getProperties(modelID, precastID, true, false);
  precast['GlobalId'] = props['GlobalId'].value; //establece propiedad GlobalId en obj precast y le asigna un valor
}

function agregarPropiedadesElementPart() {
  for (let i = 1; i < precastElements.length; i++) {
    const currentElement = precastElements[i];
    const previousElement = precastElements[i - 1];

    if (currentElement.ifcType === 'IFCBUILDINGELEMENTPART') {
      for (const prop in previousElement) {
        if (previousElement.hasOwnProperty(prop)) {
          if (!currentElement.hasOwnProperty(prop)) {
            currentElement[prop] = previousElement[prop];
          } else {
            const prefixedProp = 'BEP_' + prop;
            currentElement[prefixedProp] = previousElement[prop];
          }
        }
      }
      
      // Copiar el resto de propiedades del objeto anterior
      for (const prop in previousElement) {
        if (previousElement.hasOwnProperty(prop) && !currentElement.hasOwnProperty(prop)) {
          currentElement[prop] = previousElement[prop];
        }
      }
    }
  }
}

function eliminarElementosAssembly() {
  precastElements = precastElements.filter(element => element.ifcType !== 'IFCELEMENTASSEMBLY');
  console.log("TOTAL DE ELEMNTOS EN PRECAST: "+precastElements.length);
}
//-------------------------------------------------------------------------------------------------------------------


//TODO genera check con tipos de elemntos +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function generateCheckboxes(precastElements) {
  //agrupa los elementos por la primera letra de la propiedad ART_Pieza
  const groupedElements = precastElements.reduce((acc, el) => {
    if (el.ART_Pieza===0 ||el.ART_Pieza==="0" ||el.ART_Pieza==="" || el.ART_Pieza===undefined) {
      return acc;
    }
    const firstLetter = el.ART_Pieza.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(el);
    return acc;
  }, {});
  //genera el HTML para los checkboxes y los botones
  let html = '';
  Object.entries(groupedElements).forEach(([artPieza, elements]) => {
    html += `<div class="checkbox-button-container">`;
    html += `<button class="btnCheck" data-art-pieza="${artPieza}"> ${artPieza}</button>`;
    html += `<div class="checkbox-group">`;
    html += `<input type="checkbox" checked data-art-pieza="${artPieza}" style="margin-left: 8px">${artPieza} (${elements.length})`;
    html += `</div>`;
    html += `</div>`;
  });

  setTimeout(() => {
    addBotonCheckboxListeners();
  }, 0);
  return html;
}

function addBotonCheckboxListeners() {
  const buttons = document.querySelectorAll('.btnCheck');
  for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function() {
          const letter = this.dataset.artPieza;
          const isChecked = this.checked;
          const artPieza = this.getAttribute('data-art-pieza');
          const visibleIds = [];
          const parentText = this.parentNode.textContent.trim();
          let prevEl = null;
          precastElements.forEach(function(el, index) {
              if (allIDs.includes(el.expressID)) {
                  if (el.ART_Pieza === 0 || el.ART_Pieza === "0" || el.ART_Pieza === "" ||el.ART_Pieza=== undefined) {
                      return ;
                  }
                  if (el.ART_Pieza.charAt(0).toUpperCase() === artPieza) {
                      visibleIds.push(el.expressID);
                      }
              }
          });
          if (this.classList.contains('pulsado')) {
              this.classList.remove('pulsado');
              removeLabels(visibleIds);
          } else {
              this.classList.add('pulsado');
              generateLabels(visibleIds);
          }
      });
  }
}

function removeLabels(expressIDs) {
  const labels = document.querySelectorAll('.pieza-label'); // Buscar todos los elementos con la clase "pieza-label"
  for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const labelID = parseInt(label.id);
      if (expressIDs.includes(labelID)) {
          label.style.visibility = 'hidden';
      }
  }
}

function addCheckboxListeners() {
  
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(function(checkbox) {
    // Crear un contenedor para el checkbox y el icono
    const container = document.createElement('label');
    container.className = 'checkbox-container';

    // Mover el checkbox al contenedor
    checkbox.parentNode.insertBefore(container, checkbox);

    // Crear un icono de ojo
    const eyeIcon = document.createElement('span');
    eyeIcon.className = 'eye-icon';
    eyeIcon.innerHTML = '👁️'; // Puedes cambiar el contenido a un icono de ojo
    const artPiezaValue = checkbox.getAttribute('data-art-pieza');

    // Establecer el atributo data-art-pieza-ojo en el elemento span
    eyeIcon.setAttribute('data-art-pieza-ojo', artPiezaValue);

    // Agregar el icono de ojo al contenedor
    container.appendChild(eyeIcon);

    checkbox.addEventListener('change', function() {
      viewer.IFC.selector.unpickIfcItems();
      const isChecked = this.checked;
      const artPieza = this.getAttribute('data-art-pieza');
      const matchingIds = [];

      precastElements.forEach(function(element) {
        if (element.ART_Pieza === 0 || element.ART_Pieza === "0" || element.ART_Pieza === "" || element.ART_Pieza === undefined) {
          return;
        }

        // Comparar las dos primeras letras de ART_Pieza con artPieza
        if (element.ART_Pieza.substring(0, artPieza.length).toUpperCase() === artPieza.toUpperCase()) {
          if (!element.hasOwnProperty('Camion') || element.Camion === "") {
            matchingIds.push(element.expressID);
          }
        }
      });

      if (isChecked) {
        showAllItems(viewer, matchingIds);
      } else {
        hideAllItems(viewer, matchingIds);
      }
    });
    const eyeIcons = document.querySelectorAll('.eye-icon');
    let activeIcon = null;
    
    eyeIcons.forEach(function (icon) {
      icon.addEventListener('click', function () {
        if (activeIcon === icon) {
          icon.classList.remove('active-ojo');
          marcarCheckboxes();
          hideAllItems(viewer, allIDs);
          showAllItems(viewer, allIDs);
          activeIcon = null;
        } else {
          if (activeIcon) {
            activeIcon.classList.remove('active-ojo');
          }
          icon.classList.add('active-ojo');
          activeIcon = icon;
    
          const artPiezaOjoValue = icon.getAttribute('data-art-pieza-ojo');
          const expressOjo = [];
    
          precastElements.forEach(function (element) {
            if (element.ART_Pieza === 0 || element.ART_Pieza === "0" || element.ART_Pieza === "" || element.ART_Pieza === undefined) {
              return;
            }
            
            if (element.ART_Pieza.substring(0, artPiezaOjoValue.length).toUpperCase() === artPiezaOjoValue.toUpperCase()) {
              if (!element.hasOwnProperty('Camion') || element.Camion === "") {
                expressOjo.push(element.expressID);
              }
            }
          });
          // Mostrar solo los elementos relacionados con el icono de ojo clicado
          hideAllItems(viewer, allIDs);
          showAllItems(viewer, expressOjo);
        }
      });
    });
    
  });
}

function addCheckboxListenersExt() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const allIcons = []; 

  checkboxes.forEach(function (checkbox) {
    const container = document.createElement('label');
    container.className = 'checkbox-container';
    checkbox.parentNode.insertBefore(container, checkbox);

    const icon = document.createElement('span');
    icon.className = 'eye-icon2';
    icon.innerHTML = '👁️'; 
    icon.setAttribute('data-class', checkbox.getAttribute('data-class'));
    
    container.appendChild(icon);
    allIcons.push(icon);

    checkbox.addEventListener('change', function () {
      viewer.IFC.selector.unpickIfcItems();
      const isChecked = this.checked;
      const tipo = this.getAttribute('data-class');
      const matchingIds = [];

      for (let i = 0; i < precastElements.length; i++) {
        const element = precastElements[i];
        if (element.ifcType === tipo) {
          matchingIds.push(element.expressID);
        }
      }

      if (isChecked) {
        showAllItems(viewer, matchingIds);
        
        allIcons.forEach(function (otherIcon) {// Desactivar todos los iconos excepto el actual
          if (otherIcon !== icon) {
            otherIcon.classList.remove('active-icon');
          }
        });
        icon.classList.add('active-icon');
      } else {
        hideAllItems(viewer, matchingIds);
        // Cuando se desactive el checkbox, también se desactiva el icono
        icon.classList.remove('active-icon');
      }

    });

    const eyeIcons = document.querySelectorAll('.eye-icon2');
    let activeIcon = null;
    
    eyeIcons.forEach(function (icon) {
      icon.addEventListener('click', function () {
        if (activeIcon === icon) {
          icon.classList.remove('active-ojo');
          hideAllItems(viewer, allIDs);
          showAllItems(viewer, allIDs);
          activeIcon = null;
          const activeEyeIcon = document.querySelector('.eye-icon2.active-ojo');
          if (!activeEyeIcon) {
            checkboxes.forEach(function (cb) {
              cb.disabled = false;
            });
            console.log('Checkboxes enabled');

            let expressCheck=expressCheckActivos();
            hideAllItems(viewer, allIDs);
            showAllItems(viewer, expressCheck);
          }
        } else {
          if (activeIcon) {
            activeIcon.classList.remove('active-ojo');
          }
          icon.classList.add('active-ojo');
          activeIcon = icon;
    
          const artPiezaOjoValue = icon.getAttribute('data-class');
          const expressOjo = [];
          for (let i = 0; i < precastElements.length; i++) {
            const element = precastElements[i];
            if (element.ifcType === artPiezaOjoValue) {
              expressOjo.push(element.expressID);
            }
          }

          hideAllItems(viewer, allIDs);
          showAllItems(viewer, expressOjo);
          const activeEyeIcon = document.querySelector('.eye-icon2.active-ojo');
          if (activeEyeIcon) {
            // Si hay un icono ojo activo, desactivar todos los checkboxes
            checkboxes.forEach(function (cb) {
              cb.disabled = true;
            });
          } 
        }
      });
    });

  });
}


function expressCheckActivos() {
  const divChecktiposIfc = document.getElementById('checktiposIfc');

  if (divChecktiposIfc) {
    const checkboxes = divChecktiposIfc.querySelectorAll('input[type="checkbox"]');
    const matchingExpress = [];

    checkboxes.forEach(function (checkbox) {
      if (checkbox.checked) {
        const dataClassValue = checkbox.getAttribute('data-class');

        for (let i = 0; i < precastElements.length; i++) {
          const element = precastElements[i];
          if (element.ifcType === dataClassValue) {
            matchingExpress.push(element.expressID);
          }
        }
      }
    });
    return matchingExpress;
  }
}


async function generateLabels(expressIDs) {
  for (const expressID of expressIDs) {
    let ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ;
    
    for (const precast of precastElements) {
      if (precast.expressID === expressID) {
        ART_Pieza = precast['ART_Pieza'];
        ART_CoordX = precast['ART_cdgX'];
        ART_CoordY = precast['ART_cdgY'];
        ART_CoordZ = precast['ART_cdgZ'];
        break;
      }
    }
    muestraNombrePieza(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ, expressID);
      console.log("ART_Pieza: "+ART_Pieza+" ART_CoordX: "+ART_CoordX +" ART_CoordY: "+ART_CoordY +" ART_CoordZ: "+ART_CoordZ, + "expressID: "+expressID)
    
  }
  
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


  //******************************************************************************************************************* */
 /// ---------------estas tres funciones son necesarias para obtener solo las categorias de IFC cargado------------------------
 //-------------extrae todos los tipos de elementos del modelo y los agrupa en un objeto llamado categorias.
function setIfcPropertiesContent(ifcProject, viewer, model) {
  const ifcClass = getIfcClass(ifcProject);
  let uniqueClasses = [...new Set(ifcClass)];
  const checkboxesHTML = generateCheckboxesExt(uniqueClasses);
  document.getElementById('checktiposIfc').innerHTML = checkboxesHTML;

  const btnNota = document.querySelectorAll('.btn-notacion');
  btnNota.forEach(function(button) {
  
      const icon = document.createElement('i');
      icon.classList.add('fas', 'fa-sticky-note');
      button.appendChild(icon);

      button.addEventListener('click', function(event) {
          const checkbox = event.currentTarget.parentElement.querySelector('input[type="checkbox"]');
          if (checkbox !== null) {
              const classValue = checkbox.getAttribute('data-class');
              //console.log("Has pulsado el botón : " + classValue);
          }
      });
  });
}

//recorre el modelo y almacena el tipo de cada elemento en un array typeArray.
function getIfcClass(ifcProject) {
  let typeArray = [];
  return getIfcClass_base(ifcProject, typeArray);
}

//recursivamente  se llama a sí misma para procesar los hijos de cada elemento y agregar su tipo al array.
function getIfcClass_base(ifcProject, typeArray) {
  const children = ifcProject.children;
  if (children.length === 0) {
      typeArray.push(ifcProject.type);
  } else {
      for (const obj of children) {
          getIfcClass_base(obj, typeArray);
      }
  }
  return typeArray;
}

// Crea automaticamente los check con las categorias del IFC cargado y  asocia un numero a cada check(dataclass)
function generateCheckboxesExt(uniqueClasses) {
  let html = '';
  uniqueClasses.forEach(function(uniqueClass) {
      html += `<div class="checkbox-container">`;
      // html += `<button class="btn-notacion" data-id="${uniqueClass}"> </button>`;
      html += `<input type="checkbox" checked data-class="${uniqueClass}">${uniqueClass}`;
      html += `</div>`;
  });
  return html;
}



//TODO todosIDS, creaSUBSET************************************************************************************************************

function getAllIds(ifcModel) {
  return Array.from(
      new Set(ifcModel.geometry.attributes.expressID.array),
  );
}

function getWholeSubset(viewer, model, allIDs) {
	return viewer.IFC.loader.ifcManager.createSubset({
		modelID: model.modelID,
		ids: allIDs,
		applyBVH: true,
		scene: model.parent,
		removePrevious: true,
		customID: 'full-model-subset',
	});
}

function replaceOriginalModelBySubset(viewer, model, subset) {
	const items = viewer.context.items;  //obtiene el objeto "items" del contexto del visor y lo almacena en una variable local.
	items.pickableIfcModels = items.pickableIfcModels.filter(model => model !== model);  //Filtra las matrices y elimina cualquier referencia al modelo original
	items.ifcModels = items.ifcModels.filter(model => model !== model);
	model.removeFromParent();  //Elimina el modelo original de su contenedor principal
	items.ifcModels.push(subset);
	items.pickableIfcModels.push(subset); 
}
//**************************************************************************************************************************************

let centro;
function creaBoxHelper(){

  const boxHelper = new BoxHelper(model, 0xff000);
  //scene.add(boxHelper);

   const geometry = boxHelper.geometry;  // Obtén la geometría del BoxHelper
  

  centro = geometry.boundingSphere.center;
    
  console.log("Propiedades del objeto 'centro':");
  console.log("x:", centro.x);
  console.log("y:", centro.y);
  console.log("z:", centro.z);

  if (!centro) {
    geometry.computeBoundingSphere();
    centro=geometry.boundingSphere.center;
    console.log("CENTRO: "+centro);

  }
  // const radius = 0.1; 
  // const segments = 32; 
  // const color = 0xff0000; 
  
  // const geometry2 = new SphereGeometry(radius, segments, segments);
  // const material = new MeshBasicMaterial({ color: color });
  // const sphere = new Mesh(geometry2, material);
  
  // sphere.position.set(centro.x, centro.y, centro.z);
  
  // scene.add(sphere);

}

container.onclick = async () => {
  const loaderButton = document.getElementById('loader-button');

  // Verifica si el botón está visible
  if (loaderButton.style.display !== 'none') {
    const found = await viewer.IFC.selector.pickIfcItem(false);
  // console.log("found", JSON.stringify(found));
    
    if (found === null || found === undefined) {
      const container = document.getElementById('propiedades-container');
      container.style.visibility = "hidden";
      viewer.IFC.selector.unpickIfcItems();
      return;
    }
      const expressID = found.id;

      let ART_Pieza = null;
      let ART_Longitud = null;

      for (const precast of precastElements) {
        if (precast.expressID === expressID) {
          ART_Pieza = precast['ART_Pieza'];
          ART_Longitud = precast['ART_Longitud'];
          ART_Peso=precast['ART_Peso'];
          break;
        }
      }
      muestraPropiedades(ART_Pieza, ART_Longitud, ART_Peso);
  }
};

function ocultarLabels() {
  const piezaLabels = document.querySelectorAll('.pieza-label');
        const expressIDsOcultar = [];
  
        piezaLabels.forEach((element) => {
          if (element.style.visibility !== 'hidden') {
            const id = parseInt(element.id);
            if (!isNaN(id)) {
              expressIDsOcultar.push(id);
            }
          }
        });
        removeLabels(expressIDsOcultar);
}

function muestraPropiedades(ART_Pieza, ART_Longitud, ART_Peso) {
  const container = document.getElementById('propiedades-container');
  container.style.visibility = "visible";
  const longitudNum = parseFloat(ART_Longitud);
  const pesoNum = parseFloat(ART_Peso).toFixed(2);
  const longitudFormatted = longitudNum.toFixed(2); 

  const propiedadesDiv = document.createElement('div');
  propiedadesDiv.classList.add('propiedades');
  
  const piezaLabel = document.createElement('p');
  piezaLabel.innerHTML = `Pieza: <strong>${ART_Pieza}</strong>`;
  
  const longitudLabel = document.createElement('p');
  longitudLabel.innerHTML = `Longitud: <strong>${longitudFormatted}</strong>`;
  
  const pesoLabel = document.createElement('p');
  pesoLabel.innerHTML = `Peso: <strong>${pesoNum}</strong>`;
  
  propiedadesDiv.appendChild(piezaLabel);
  propiedadesDiv.appendChild(longitudLabel);
  propiedadesDiv.appendChild(pesoLabel);
  
  const propiedadesContainer = document.getElementById('propiedades-container');
  propiedadesContainer.innerHTML = ''; // Limpia el contenido existente
  propiedadesContainer.appendChild(propiedadesDiv);
}

function muestraNombrePieza(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ, expressID) {
  if (ART_Pieza === undefined || ART_CoordX === undefined || ART_CoordY === undefined || ART_CoordZ === undefined) {
      return;
  } else {
      const elements = document.getElementsByTagName('p');
      let count = 0;
      for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.textContent.startsWith(ART_Pieza) && element.expressID ===expressID) {
              if (element.style.visibility === 'hidden') {
                  element.style.visibility = 'visible';
              }
          count++;
          }
      }
      if (count === 0) {
        const label = document.createElement('p');
        label.textContent = ART_Pieza;
        label.classList.add('pieza-label');
        label.id = expressID;
        const labelObject = new CSS2DObject(label);
        const adjustedX = parseFloat(ART_CoordX) / 1000;
        const adjustedY = -parseFloat(ART_CoordY) / 1000;
        const adjustedZ = parseFloat(ART_CoordZ) / 1000;
        labelObject.position.set(adjustedX, adjustedZ, adjustedY); // Ajustar coordenadas Y debido a la conversión de ejes
        
        console.log("Coordenadas ajustadas:", adjustedX, adjustedY, adjustedZ);
        // console.log(labelObject.scale);
        // console.log(labelObject.rotation);
        scene.add(labelObject);
    }
  }
}

function hideAllItems(viewer, ids) {
  viewer.IFC.loader.ifcManager.removeFromSubset(
      0,
      ids,
      'full-model-subset',
  );
}

function showAllItems(viewer, ids) {
	viewer.IFC.loader.ifcManager.createSubset({
		modelID: 0,
		ids,
		removePrevious: false,
		applyBVH: true,
		customID: 'full-model-subset',
	});
}

function marcarCheckboxes() {
  const checkboxContainer = document.getElementById('checkbox-container');
  const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
  
  checkboxes.forEach(checkbox => {
      checkbox.checked = true;
  });
}
//Nave cube
// viewer.container = container;
// const navCube = new NavCube(viewer);
// navCube.onPick(model);
// viewer.clipper.active = true;


// TODO: Buscar elementos en el modelo
const btnBuscar = document.getElementById('btn-lateral-propiedades');
let propActive= false;
const divInputText= document.getElementById("inputARTP");
const inputText = document.querySelector("#inputARTP input[type='text']");
const checkBox = document.getElementById('checkLabels'); 
const infoBusquedas = document.getElementById("infoBusquedas");
btnBuscar.onclick= () => {

  viewer.context.ifcCamera.toggleProjection();
  if(propActive){
    btnBuscar.classList.remove('active');
    propActive= false;
  }else{
    btnBuscar.classList.add('active');
    propActive= true;
  }

}
let numBusquedas = 0;
let expressIDsInput;
let listaElementosEncontrados = null;

inputText.addEventListener('change', function() {
  infoBusquedas.querySelector("p").textContent = "";
  // removeLabels(expressIDsInput);
  if (propActive) {
      const elementoBuscado = inputText.value.trim().toUpperCase();
      numBusquedas++;
      if (elementoBuscado) {
          const elementosEncontrados = [];
          for (let i = 0; i < precastElements.length; i++) {
              if (precastElements[i].ART_Pieza === elementoBuscado) {
                  elementosEncontrados.push(precastElements[i]);
              }
          }
          expressIDsInput = elementosEncontrados.map(elemento => elemento.expressID);
          if (elementosEncontrados.length > 0) {
              const nuevaListaElementosEncontrados = document.createElement("ul");
              nuevaListaElementosEncontrados.classList.add("elementos-encontrados");
              elementosEncontrados.sort((a, b) => a.Camion - b.Camion);

              elementosEncontrados.forEach((elemento) => {
                  const listItem = document.createElement("li");
                  const nombreElemento = elemento.ART_Pieza;
                  const camionPertenece = elemento.Camion ? elemento.Camion : "-----";
  
                  listItem.textContent = `Elemento: ${nombreElemento}, Camión: ${camionPertenece}`;
                  nuevaListaElementosEncontrados.appendChild(listItem);
                  
              });
              modelCopyCompletoFunction();
              if (listaElementosEncontrados) {
                  infoBusquedas.replaceChild(nuevaListaElementosEncontrados, listaElementosEncontrados);
              } else {
                  infoBusquedas.appendChild(nuevaListaElementosEncontrados);
              }
              listaElementosEncontrados = nuevaListaElementosEncontrados;
              hideAllItems(viewer, idsTotal);
              showAllItems(viewer, expressIDsInput);
          } else {
              infoBusquedas.querySelector("p").textContent = "No existe el elemento: " + elementoBuscado;
          }
          if (checkBox.checked) {
              generateLabels(expressIDsInput);
          } else {
              removeLabels(expressIDsInput);
          }
      } else {
          // btnBuscar.style.background= '#fff0c2';
          // btnBuscar.addClass.remove('active');
          hideAllItems(viewer, idsTotal);
          showAllItems(viewer, allIDs);
          removeLabels(expressIDsInput);
          divInputText.style.display = "none";
          scene.remove(modelCopyCompleto);
      }
  }
});

let modelCopyCompleto=null;
function modelCopyCompletoFunction(){

  const materialSolid = new MeshLambertMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0x146b10,//0x54a2c4
  });
modelCopyCompleto = new Mesh(model.geometry, materialSolid);
        scene.add(modelCopyCompleto);
}

//TODO: Medir el modelo
const measureButton = document.getElementById('btn-lateral-medir');
let measuresActive = false;
measureButton.onclick = () => {
    if(measuresActive) {
        measuresActive = !measuresActive;
        measureButton.classList.remove('active');
        viewer.dimensions.deleteAll();
        viewer.dimensions.previewActive = measuresActive;
    } else {
        measuresActive = !measuresActive;
        measureButton.classList.add('active');
        viewer.dimensions.active = measuresActive;
        viewer.dimensions.previewActive = measuresActive;
    };
};

const cutButton = document.getElementById('btn-lateral-seccion');
let cutActive = false;
let isXPlaneCreated = false;
let isYPlaneCreated = false; 
let isZPlaneCreated = false; 

cutButton.onclick = () => {
  if (cutActive) {
    cutActive = !cutActive;
    cutButton.classList.remove('active');
    viewer.clipper.deleteAllPlanes();
    isXPlaneCreated = false; 
    isYPlaneCreated = false;
    isZPlaneCreated = false;
    planoCorteCont=0;
  } else {
    cutActive = !cutActive;
    cutButton.classList.add('active');
    viewer.clipper.active = cutActive;
  }
};

let planoCorteCont=0;
// TODO: cortar y medir
container.addEventListener("mousedown", async () => {
  if (cutActive) { // Verificar si está activo el modo de corte
    const found = await viewer.IFC.selector.pickIfcItem(false);
    viewer.IFC.selector.unpickIfcItems();
  
    if (found !== null && found !== undefined) {
      // Verificar si ya se ha creado un plano de corte en el eje X
      if (planoCorteCont===0) {
        creaPlano();
        planoCorteCont++
      }
    }
  }
  if (measuresActive) {
      viewer.dimensions.create();
  }
});


function creaPlano(){

viewer.clipper.createPlane();
        const ifcPlane = viewer.clipper.planes[viewer.clipper.planes.length - 1];
  
        if (ifcPlane.normal.y === 1) {
          ifcPlane.normal.y = -1;
        }
        if (ifcPlane.normal.x === 1) {
          ifcPlane.normal.x = -1;
        }
        if (ifcPlane.normal.z === 1) {
          ifcPlane.normal.z = -1;
        }
}
// TODO: obtener plantas con sus elementos en modelo ArteP
let floorplansActive = false;
const floorplanButton = document.getElementById('btn-lateral-plantas');
let floorplansButtonContainer = document.getElementById('button-container');
const checkboxContainer = document.getElementById('checkbox-container');
const btnArtIfc = document.getElementById('loader-button');
const checkboxContainerTipos = document.getElementById('checktiposIfc');

floorplanButton.onclick = () => {
  if (btnMuestraCheckElementos.classList.contains('active')) {
    btnMuestraCheckElementos.click();
  }
  if (checkboxContainerTipos.style.display !== "none") {  // Oculta el elemento filtrar en los checkBox
    checkboxContainerTipos.style.visibility="hidden"
  }

  if(floorplanButton.classList.contains('active')) {
    elementsArray=[];
  }
  const buttonContainer = document.getElementById('button-container');
  const activeButton = buttonContainer.querySelector('button.activo');
  
  if (activeButton) {
    // Si hay un botón activo dentro de button-container, ejecuta viewer.plans.exitPlanView()
    viewer.plans.exitPlanView();
  }

  let btnIfcArt=document.getElementById('loader-button');
  let btnIfcArteTipos=document.getElementById('loader-button-arte-tipos');
  if (!floorplansActive && btnIfcArt.style.display==='none'&& btnIfcArteTipos.style.display==='none'){
    floorplanButton.classList.add('active');
    getPlantasExt();
  }else{
    let botonesPlantasExt=document.getElementById('button-container');
    botonesPlantasExt.style.visibility="hidden"
  }
  if(floorplansActive ) {
    checkboxContainer.style.visibility = 'hidden';
    marcarCheckboxes();
    floorplansActive = !floorplansActive;
    floorplanButton.classList.remove('active');
    floorplansButtonContainer.classList.remove('visible');

    floorplansButtonContainer.style.visibility = 'hidden';

    //checkboxContainerTipos.style.visibility="visible"

    //desactiva los botones de plantas cuando se apaga el boton que genera los planos
    const containerForButtons = document.getElementById('button-container');
    const buttons = containerForButtons.querySelectorAll('button');
    for (const button of buttons) {
      if (button.classList.contains('activo')) {
        button.classList.remove('activo');
        hideAllItems(viewer, idsTotal );
        showAllItems(viewer, idsTotal);
      }
    }
    ocultaBtnRemoveClass();
    ocultarLabels();
    
  } else {
    checkboxContainer.style.visibility='hidden';
    showAllItems(viewer, allIDs);
    floorplansActive = !floorplansActive;
    floorplanButton.classList.add('active');
    floorplansButtonContainer = document.getElementById('button-container');
    floorplansButtonContainer.style.visibility = 'visible';
    
  }
  
};

function findNodeWithExpressID(node, expressID) {
  if (node.expressID === expressID) {
    return node;
  }
  for (const childNode of node.children) {
    const foundNode = findNodeWithExpressID(childNode, expressID);
    if (foundNode) {
      return foundNode;
    }
  }
  return null;
}

async function getPlantasExt(){
  await viewer.plans.computeAllPlanViews(model.modelID);

	const lineMaterial = new LineBasicMaterial({ color: 'black' });
	const baseMaterial = new MeshBasicMaterial({
		polygonOffset: true,
		polygonOffsetFactor: 1, // positive value pushes polygon further away
		polygonOffsetUnits: 1,
	});
	

	// Floor plan viewing

	const allPlans = viewer.plans.getAll(model.modelID);

	const container = document.getElementById('button-container');
  container.style.visibility='visible'
  container.innerHTML = '';

  for (const plan of allPlans) {
    const currentPlan = viewer.plans.planLists[model.modelID][plan];
    const button = document.createElement('button');
    container.appendChild(button);
    button.textContent = currentPlan.name;
  
    button.onclick = () => {
      
      const allButtons = container.querySelectorAll('button');
  
      allButtons.forEach((otherButton) => {
        otherButton.classList.remove('activo');
      });
      button.classList.add('activo');
  
      viewer.plans.goTo(model.modelID, plan);
      viewer.edges.toggle('example', true);
    };
  }
  

	const button = document.createElement('button');
	container.appendChild(button);
	button.textContent = 'Exit';
	button.onclick = () => {
    const buttonContainer = document.getElementById('button-container');
    const activeButton = buttonContainer.querySelector('button.activo');
    
    if (activeButton) {
      // Si hay un botón activo dentro de button-container, ejecuta viewer.plans.exitPlanView()
      activeButton.classList.remove('activo');
    }
		viewer.plans.exitPlanView();
		viewer.edges.toggle('example', false);
	};

}

let elementsArray = [];
const elementsArraysByPlan = {};
async function getPlantas(model) {
  await viewer.plans.computeAllPlanViews(model.modelID);

  const lineMaterial = new LineBasicMaterial({ color: 'black' });
  const baseMaterial = new MeshBasicMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 1, 
    polygonOffsetUnits: 1,
  });

  viewer.edges.create('example', model.modelID, lineMaterial, baseMaterial);

  const containerForPlans = document.getElementById('button-container');
  const buttonGroup = document.createElement('div'); // nuevo div para agrupar botones
  containerForPlans.appendChild(buttonGroup);
  buttonGroup.style.display = 'flex'; 
  buttonGroup.style.flexWrap = 'wrap'; 

  const allPlans = viewer.plans.getAll(model.modelID);

  for (const plan of allPlans) {
  
    const currentPlan = viewer.plans.planLists[model.modelID][plan]; //Información  de cada planta

    const divBotonesPlantas = document.createElement('div'); //contenedor para cada fila de botones
    buttonGroup.appendChild(divBotonesPlantas);
    divBotonesPlantas.style.display = 'flex'; 
    divBotonesPlantas.style.alignItems = 'center';

    const button = document.createElement('button');
    divBotonesPlantas.appendChild(button); 
    button.textContent = currentPlan.name; 
    button.setAttribute('data-express-id', currentPlan.expressID);

    const btnLabelPlantas = document.createElement('button');
    divBotonesPlantas.appendChild(btnLabelPlantas); 
    btnLabelPlantas.textContent = 'N';
    btnLabelPlantas.style.width = '30px'; 
    btnLabelPlantas.style.marginLeft = '5px'; 
    btnLabelPlantas.style.visibility = 'hidden';
    btnLabelPlantas.classList.add('btnLabelPlanta');


    const btn2DPlantas = document.createElement('button');
    divBotonesPlantas.appendChild(btn2DPlantas); 
    btn2DPlantas.textContent = '2D';
    btn2DPlantas.style.width = '30px'; 
    btn2DPlantas.style.marginLeft = '5px'; 
    btn2DPlantas.style.visibility = 'hidden';
    btn2DPlantas.classList.add('btn2DPlanta');

    
    

    button.onclick = async () => {
        ocultarLabels();
        viewer.IFC.selector.unpickIfcItems();
        const expressIDplanta = parseInt(button.dataset.expressId);
        console.log("ExpressId: " + expressIDplanta + " de la planta: " + button.textContent);
    
        
    
        //comprueba si algun btn2D está pulsado
        var container = document.querySelector('.button-container');
        var elementos = container.querySelectorAll('.activoBtn2DPlanta');
    
        // Verificar si alguno de los elementos contiene la clase deseada
        var contieneClase = false;
        for (var i = 0; i < elementos.length; i++) {
            if (elementos[i].classList.contains('activoBtn2DPlanta')) {
                contieneClase = true;
                break;
            }
        }
    
        if (contieneClase) {
            viewer.context.ifcCamera.toggleProjection();
            viewer.context.ifcCamera.cameraControls.setLookAt(posicionInicial.x, posicionInicial.y, posicionInicial.z, centro.x, centro.y, centro.z);
        }
    
        //elementsArray = elementsArraysByPlan[currentPlan.name] || []; // Obtén el array existente o recién creado
        try {
            const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
    
            function findElementsInChildren(node) {
                for (const childNode of node.children) {
                    if (!elementsArray.includes(childNode.expressID)) {
                        elementsArray.push(childNode.expressID);
                    }
                    findElementsInChildren(childNode);
                }
            }
            function removeElementsInChildren(node) {
              for (const childNode of node.children) {
                  // Eliminar el expressID del nodo hijo actual del array
                  const index = elementsArray.indexOf(childNode.expressID);
                  if (index !== -1) {
                      elementsArray.splice(index, 1);
                  }
                  removeElementsInChildren(childNode);
              }
          }
    
            // busca el nodo de la planta deseada en la estructura 
            const plantaNode = findNodeWithExpressID(ifcProject, expressIDplanta);
            console.log(plantaNode)
    
            if (plantaNode) {
                // if (elementsArraysByPlan[currentPlan.name]) {
                //     const elementsArray = elementsArraysByPlan[currentPlan.name];
                //     if (elementsArray.length > 0) {
                //         console.log(`Array existente en memoria ${currentPlan.name}:`, elementsArray);
                //     } else {
                //         console.log(`Array existente en memoria ${currentPlan.name}, pero está vacío.`);
                //         findElementsInChildren(plantaNode);
                //     }
                // } else {
                //     console.log(`No existe un array en memoria para ${currentPlan.name}.`);
                //     findElementsInChildren(plantaNode);
                // }
                hideAllItems(viewer, idsTotal);
                // Si el botón ya está activo, desactívalo
               // findElementsInChildren(plantaNode);
                if (button.classList.contains('activo')) {
                  button.classList.remove('activo');
                  removeElementsInChildren(plantaNode);
                }
                else{
                  button.classList.add('activo');
                  findElementsInChildren(plantaNode);
                }
                showAllItems(viewer, elementsArray);
    
                const btnLabelPlantasList = document.querySelectorAll('.btnLabelPlanta');
                btnLabelPlantasList.forEach((btnLabel) => {
                    btnLabel.style.visibility = 'hidden';
                });
    
                btnLabelPlantas.style.visibility = 'visible';
                const btn2DPlantasList = document.querySelectorAll('.btn2DPlanta');
                btn2DPlantasList.forEach((btn2D) => {
                    btn2D.style.visibility = 'hidden';
                    btn2D.classList.remove('activoBtn2DPlanta');
                });
    
                btn2DPlantas.style.visibility = 'visible';
    
            } else {
                console.log('No se encontró el nodo de la planta');
            }
        } catch (error) {
            console.log('Error al obtener la estructura espacial:', error);
        }
    
       // button.classList.add('activo');
    };
    

        
        
        
  
    btnLabelPlantas.onclick = async () => {
      const activeBtnLabelPlanta = document.querySelector('.btnLabelPlanta.activoBtnLabelPlanta');
    
      // Si hay un botón activo y es el mismo que se hizo clic, quitar la clase
      if (activeBtnLabelPlanta === btnLabelPlantas) {
        btnLabelPlantas.classList.remove('activoBtnLabelPlanta');
        removeLabels(elementsArray);
      } else {
        // Si hay un botón activo y no es el mismo que se hizo clic, eliminar la clase
        if (activeBtnLabelPlanta) {
          activeBtnLabelPlanta.classList.remove('activoBtnLabelPlanta');
        }
        btnLabelPlantas.classList.add('activoBtnLabelPlanta');
        generateLabels(elementsArray);
      }
    }
    
    let plantaActivo = false;
    
    btn2DPlantas.onclick = () => {
      if (btn2DPlantas.classList.contains('activoBtn2DPlanta')) {
        btn2DPlantas.classList.remove('activoBtn2DPlanta');
        plantaActivo = false;
        generatePlanta2D(plantaActivo);
      } else {
        btn2DPlantas.classList.add('activoBtn2DPlanta');
        plantaActivo = true;
        if (!posicionInicial) {
          // Almacenar la posición actual de la cámara antes de cambiarla
          const camera = viewer.context.getCamera();
          posicionInicial = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
          };
        }
        generatePlanta2D(plantaActivo);
      }
    };
    
  }
  
    const button = document.createElement('button');
    containerForPlans.appendChild(button);
    button.textContent = 'Exit floorplans';
    button.onclick = () => {

      hideAllItems(viewer, idsTotal );
      showAllItems(viewer, idsTotal);
      ocultarLabels();
      const activeButtons = containerForPlans.querySelectorAll('button.activo');
      activeButtons.forEach((activeButton) => {
        activeButton.classList.remove('activo');
      });
      ocultaBtnRemoveClass();
      const buttonContainer = document.getElementById('button-container');
      buttonContainer.style.visibility = 'hiden';
      const btnLateralPlantas = document.getElementById('btn-lateral-plantas');

      // Haz clic en el elemento
      btnLateralPlantas.click();
      
    };
}

function ocultaBtnRemoveClass(){
  const btnLabelPlantasList = document.querySelectorAll('.btnLabelPlanta');
  btnLabelPlantasList.forEach((btnLabel) => {
      btnLabel.style.visibility = 'hidden';
      btnLabel.classList.remove('activoBtnLabelPlanta');  
  });
  let container = document.querySelector('.button-container');
  let elementos = container.querySelectorAll('.activoBtn2DPlanta');
  
  var contieneClase = false;
  for (var i = 0; i < elementos.length; i++) {
      if (elementos[i].classList.contains('activoBtn2DPlanta')) {
          contieneClase = true;
          break;
      }
  }

  if (contieneClase) {
    viewer.context.ifcCamera.toggleProjection();
  }
  const btn2DPlantasList = document.querySelectorAll('.btn2DPlanta');
      btn2DPlantasList.forEach((btn2D) => {
        btn2D.style.visibility = 'hidden';
        btn2D.classList.remove('activoBtn2DPlanta');  
  });
  if (posicionInicial==null){
    return;
  }
  else{
    viewer.context.ifcCamera.cameraControls.setLookAt(posicionInicial.x, posicionInicial.y, posicionInicial.z, centro.x, centro.y, centro.z);
  }
}

let posicionInicial = null;
function generatePlanta2D(plantaActivo) {
  
  //const screenShot = viewer.context.renderer.newScreenshot(camera);
  // CREA UN IMAGEN DE LA CAMARA EN ESA POSICION

  if (plantaActivo) {
    
    viewer.context.ifcCamera.cameraControls.setLookAt(centro.x, centro.y+80, centro.z, centro.x, centro.y, centro.z); 
    viewer.context.ifcCamera.toggleProjection();
    
  } else {
    if (posicionInicial) {
      viewer.context.ifcCamera.cameraControls.setLookAt(posicionInicial.x, posicionInicial.y, posicionInicial.z, centro.x, centro.y, centro.z);
      viewer.context.ifcCamera.toggleProjection();
      posicionInicial=null;
    }
  }
}

// TODO: Fantasma, visualiza modelo translucido completo
const ifcCompletoButton = document.getElementById('btn-ifc-completo');
let ifcCompletoActive = false;

ifcCompletoButton.onclick = () => {
  ifcCompletoActive=!ifcCompletoActive;
  if (ifcCompletoActive) {
    ifcCompletoButton.classList.add('active');
    modelCopyCompletoFunction();
  } else {
    ifcCompletoButton.classList.remove('active');
    scene.remove(modelCopyCompleto);
  }
};


//btn elementos muestar u oculta div elementos
const btnMuestraCheckElementos=document.getElementById('btn-ver-elementos');
const divCheckTiposIfc = document.getElementById('checktiposIfc')
const divCheckElementos =document.getElementById('checkbox-container') 
btnMuestraCheckElementos.addEventListener('click', function() {
  if (btnMuestraCheckElementos.classList.contains('active')) {
    btnMuestraCheckElementos.classList.remove('active');
    divCheckTiposIfc.style.visibility='hidden'
    divCheckElementos.style.visibility='hidden'
  } else {
    btnMuestraCheckElementos.classList.add('active');
    divCheckTiposIfc.style.visibility='visible'
    divCheckElementos.style.visibility='visible'
  }
});






