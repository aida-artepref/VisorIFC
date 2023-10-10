import { Color, SphereGeometry , MeshLambertMaterial,  MeshBasicMaterial, LineBasicMaterial, Mesh, BoxHelper}  from 'three';
import{ IfcViewerAPI } from 'web-ifc-viewer';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs,  addDoc, doc, setDoc, query, updateDoc   } from "firebase/firestore";


//--------------------------------------firebase------------------------------------------------
//Configuracion
const firebaseConfig = {
    apiKey: "AIzaSyDTlGsBq7VwlM3SXw2woBBqHsasVjXQgrc",
    authDomain: "cargas-917bc.firebaseapp.com",
    projectId: "cargas-917bc",
    storageBucket: "cargas-917bc.appspot.com",
    messagingSenderId: "996650908621",
    appId: "1:996650908621:web:b550fd82697fc26933a284"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const botonConexion = document.getElementById('conexion')

botonConexion.addEventListener("click", () => {
  insertaModeloFire()
  botonConexion.style.display='none'
});

//Consulta de la colección existente
async function getExistingDocs(collectionRef) {
  try {
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error('Error al obtener los documentos existentes:', error);
    return [];
  }
}

function compareAndUpdateDocuments(existingDocs, precastElements, viewer) {
  let documentosIguales = true;

  for (const matchingObject of precastElements) {
    const existingDocData = existingDocs.find((objeto) => objeto.GlobalId === matchingObject.GlobalId);

    if (!existingDocData) {
      console.log('Documento faltante:', matchingObject.GlobalId);
      documentosIguales = false;
    } else {
      const fields = Object.keys(existingDocData);
      let hasChanges = false;

      for (const field of fields) {
        if (field === 'expressID') {
          if (existingDocData[field] !== matchingObject[field]) {
            hasChanges = true;
            matchingObject[field] = existingDocData[field];
          }
        } else if (existingDocData[field] !== matchingObject[field]) {
          hasChanges = true;
          matchingObject[field] = existingDocData[field];
        }
      }

      if (hasChanges) {
        documentosIguales = false;
      }
    }
  }

  if (documentosIguales) {
    console.log('La colección tiene los mismos documentos y campos.');
  } else {
    console.log('La colección tiene diferencias en documentos o campos.');
    const checkboxContainer = document.getElementById('checkbox-container');
    checkboxContainer.innerHTML = generateCheckboxes(precastElements);
    checkboxContainer.style.visibility = "visible";
    addCheckboxListeners(precastElements, viewer);

    const camionesUnicos = obtenerValorCamion(precastElements);
    generaBotonesNumCamion(camionesUnicos);
  }
}

function createCheckboxesAndButtons(existingDocs, precastElements, viewer) {
  for (const matchingObject of precastElements) {
    const existingDocData = existingDocs.find((objeto) => objeto.GlobalId === matchingObject.GlobalId);

    if (existingDocData) {
      const fields = Object.keys(existingDocData);

      for (const field of fields) {
        if (field === 'expressID') {
          if (existingDocData[field] !== matchingObject[field]) {
            matchingObject[field] = existingDocData[field];
          }
        } else if (existingDocData[field] !== matchingObject[field]) {
          matchingObject[field] = existingDocData[field];
        }
      }
    }
  }
  const checkboxContainer = document.getElementById('checkbox-container');
  checkboxContainer.innerHTML = generateCheckboxes(precastElements);
  checkboxContainer.style.visibility = "visible";
  addCheckboxListeners(precastElements, viewer);

  const camionesUnicos = obtenerValorCamion(precastElements);
  generaBotonesNumCamion(camionesUnicos);
}

async function insertaModeloFire() {
  try {
    collectionRef = collection(db, projectName);
    const existingDocs = await getExistingDocs(collectionRef);
    const existingDocsCount = existingDocs.length;

    if (existingDocsCount > 0) {
      console.log('La colección ya existe: ' + projectName);
      console.log('Número de piezas existentes en: ' + projectName, existingDocsCount);

      if (existingDocsCount === precastElements.length) {
        compareAndUpdateDocuments(existingDocs, precastElements, viewer);
      } else {
        createCheckboxesAndButtons(existingDocs, precastElements, viewer);
      }
    } else {
      // await addDocumentsToFirestore(db, projectName, precastElements);
    }
  } catch (error) {
    console.error('Error al realizar la tarea de inserción:', error);
  }
}

let projectName = null;
async function obtieneNameProject(url){
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.includes('IFCPROJECT')) {
        const fields = line.split(',');
        projectName = fields[2].replace(/'/g, '');
        break;
        }
    }

    if (projectName) {
        console.log('Nombre del proyecto:', projectName);
        precastCollectionRef = collection(db, projectName);
    } else {
        
        console.log('No se encontró el nombre del proyecto');
    }
}
//----------------------------------------------------------------------------------------------------------------------------
const container = document.getElementById('app');
const viewer = new IfcViewerAPI({container, backgroundColor: new Color("#EDE8BA")});
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
viewer.IFC.selector.defSelectMat.color = new Color(68, 137, 0);

const GUI={
    input: document.getElementById("file-input"),
    loader: document.getElementById("loader-button"),
    importloader: document.getElementById("importButton"),
}

//Muestra el nombre del archivo abierto
document.getElementById("file-input").addEventListener("change", function() {
    const file = this.files[0];
    document.getElementById("file-name").innerHTML = file.name;
    document.getElementById("file-name").style.display = "block"; 
});

GUI.loader.onclick = () => GUI.input.click();  //al hacer clic al boton abre cuadro de dialogo para cargar archivo

GUI.input.onchange = async (event) => {
    const file=event.target.files[0];
    const url=URL.createObjectURL(file);
    loadModel(url); 
}

let model;
let allIDs;
let idsTotal;
let expressIDNoMontados=[];
let uniqueTypes=[];
let precastElements=[];
let subset;

async function loadModel(url) {
  model = await viewer.IFC.loadIfcUrl(url);
  getPlantas(model);
  createPrecastElementsArray(model.modelID).then((precastElements) => {
    cargaGlobalIdenPrecast(precastElements);
  });
  allIDs = getAllIds(model);
  idsTotal = getAllIds(model);
  expressIDNoMontados = getAllIds(model);
  viewer.shadows = true;

  subset = getWholeSubset(viewer, model, allIDs);
  replaceOriginalModelBySubset(viewer, model, subset);

  viewer.context.fitToFrame();
  creaBoxHelper();
  obtieneNameProject(url)

  const btnBD = document.getElementById("conexion");
  btnBD.style.visibility='visible';

}


function creaBoxHelper(){

  const boxHelper = new BoxHelper(model, 0xff000);
  scene.add(boxHelper);

   const geometry = boxHelper.geometry;  // Obtén la geometría del BoxHelper
  

  let centro = geometry.boundingSphere.center;
    
  console.log("Propiedades del objeto 'centro':");
  console.log("x:", centro.x);
  console.log("y:", centro.y);
  console.log("z:", centro.z);

  if (!centro) {
    geometry.computeBoundingSphere();
    centro=geometry.boundingSphere.center;
    console.log("CENTRO: "+centro);

  }
  const radius = 0.1; 
  const segments = 32; 
  const color = 0xff0000; 
  
  const geometry2 = new SphereGeometry(radius, segments, segments);
  const material = new MeshBasicMaterial({ color: color });
  const sphere = new Mesh(geometry2, material);
  
  sphere.position.set(centro.x, centro.y, centro.z);
  
  scene.add(sphere);

}

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
    const elementsArray = [];

    button.onclick = async () => {
      ocultarLabels()
      const expressIDplanta = parseInt(button.dataset.expressId);
      console.log("ExpressId: "+expressIDplanta+" de la planta: "+button.textContent);
      
      try {
        const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
    
        // recursiva para buscar los elementos hijos en la estructura 
        function findElementsInChildren(node) {
          for (const childNode of node.children) {
            if (!elementsArray.includes(childNode.expressID)) {
              elementsArray.push(childNode.expressID);
            }
            findElementsInChildren(childNode);
          }
        }
        // busca el nodo de la planta deseada en la estructura 
        const plantaNode = findNodeWithExpressID(ifcProject, expressIDplanta);
    
        
        if (plantaNode) {
          
          findElementsInChildren(plantaNode);
          hideAllItems(viewer, idsTotal );
          showAllItems(viewer, elementsArray);
          console.log(elementsArray);

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

  

      const activeButton = containerForPlans.querySelector('button.activo');
      if (activeButton) {
        activeButton.classList.remove('activo');
        const correspondingBtnLabel = activeButton.nextElementSibling;
        if (correspondingBtnLabel.classList.contains('btnLabelPlanta')) {
          // correspondingBtnLabel.style.visibility = 'hidden';
          correspondingBtnLabel.classList.remove('activoBtnLabelPlanta'); // Remover la clase 'activoBtnLabelPlanta' cuando se oculta
          
        }
      }
      button.classList.add('activo');
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
      const activeButton = containerForPlans.querySelector('button.activo');
      if (activeButton) {
        activeButton.classList.remove('activo');
      }
      ocultaBtnRemoveClass();
    };
}

function ocultaBtnRemoveClass(){
  const btnLabelPlantasList = document.querySelectorAll('.btnLabelPlanta');
  btnLabelPlantasList.forEach((btnLabel) => {
      btnLabel.style.visibility = 'hidden';
      btnLabel.classList.remove('activoBtnLabelPlanta');  
      
});
const btn2DPlantasList = document.querySelectorAll('.btn2DPlanta');
  btn2DPlantasList.forEach((btn2D) => {
    btn2D.style.visibility = 'hidden';
    btn2D.classList.remove('activoBtn2DPlanta');  
});
viewer.context.ifcCamera.cameraControls.setLookAt(posicionInicial.x, posicionInicial.y, posicionInicial.z, 0, 0, 0);

}

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

let posicionInicial = null;
function generatePlanta2D(plantaActivo) {
  
  //const screenShot = viewer.context.renderer.newScreenshot(camera);
  // CREA UN IMAGEN DE LA CAMARA EN ESA POSICION

  if (plantaActivo) {
    viewer.context.ifcCamera.cameraControls.setLookAt(0, 50, 0, 0, 0, 0);
    viewer.context.ifcCamera.toggleProjection();
    
  } else {
    if (posicionInicial) {
      viewer.context.ifcCamera.cameraControls.setLookAt(posicionInicial.x, posicionInicial.y, posicionInicial.z, 0, 0, 0);
      viewer.context.ifcCamera.toggleProjection();
      posicionInicial=null;
    }
  }
}


async function createPrecastElementsArray(modelID){
  const ifcProject = await viewer.IFC.getSpatialStructure (modelID);
  

  const constructPrecastElements = (node) => {
      const children = node.children;
      const exists = uniqueTypes.includes(node.type);
      // TODO: elementos de IFC excluidos BUILDING y SITE
      if (!exists && node.type !== "IFCBUILDING" && node.type !== "IFCSITE" && node.type !== "IFCBUILDINGSTOREY" && node.type !== "IFCELEMENTASSEMBLY" && node.type !== "IFCBUILDINGELEMENTPROXY") {
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

function getAllIds(ifcModel) {
  return Array.from(
      new Set(ifcModel.geometry.attributes.expressID.array),
  );
}

function cargaGlobalIdenPrecast(){
  //Carga la propiedade GlobalId al array precastElements
      precastElements.forEach(precast => {
          if (precast.ifcType !='IFCBUILDING'){
              precastPropertiesGlobalId(precast, 0, precast.expressID);
          }
      }); 
      
}

async function precastPropertiesGlobalId(precast,modelID, precastID){
  const props = await viewer.IFC.getProperties(modelID, precastID, true, false);
  precast['GlobalId'] = props['GlobalId'].value; //establece propiedad GlobalId en obj precast y le asigna un valor
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

const materialRojo = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.5,
  color: 0xff0000, 
  depthTest: false,
  
});

const materialVerde = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.5,
  color: 0x00ff00, 
  depthTest: false,
  
});

function getWholeSubsetColorVerde(viewer, model, expressIDMontados) {
  if (expressIDMontados.length === 0) {
      return; 
  }
  // viewer.IFC.loader.ifcManager.clearSubset(
  //   model[0],
  //   'montaje-verde',
  //   materialVerde,
  // );
  return viewer.IFC.loader.ifcManager.createSubset({
      modelID: model.modelID,
      ids: expressIDMontados,
      applyBVH: true,
      scene: viewer.context.getScene(),
      removePrevious: true,
      customID: 'montaje-verde',
      material: materialVerde,
  });
}

function getWholeSubsetColorRojo(viewer, model, expressIDNoMontados) {
  if (expressIDNoMontados.length === 0) {
    return; // array vacío, sale
}
  //  viewer.IFC.loader.ifcManager.clearSubset(
  //    model[0],
  //    'montaje-rojo',
  //    materialRojo,
  //  );
	return viewer.IFC.loader.ifcManager.createSubset({
		modelID: model.modelID,
		ids: expressIDNoMontados,
		applyBVH: true,
    scene:viewer.context.getScene(),
		removePrevious: true,
		customID: 'montaje-rojo',
    material:materialRojo,
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

function replaceOriginalBySubset(viewer) {
	const items = viewer.context.items;   
  items.ifcModels.push(subset); 
  items.pickableIfcModels.push(subset);
	model.removeFromParent();  //Elimina el modelo original de su contenedor principal
  // items.ifcModels = items.ifcModels.filter(s=>s !== subset)
  // items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subset)
}

//TODO: onclick en visor
container.onclick = async () => {
  const found = await viewer.IFC.selector.pickIfcItem(false);

  if (found === null || found === undefined) {
    const prop_container = document.getElementById('propiedades-container');
    prop_container.style.visibility = "hidden";
    viewer.IFC.selector.unpickIfcItems();
    return;
  }



  if (btnEstadoMontaje.classList.contains('active')) {
    viewer.IFC.selector.unpickIfcItems();
    if (found && found.id) {
      console.log("existe foundID"+found.id);
      if (expressIDMontados.includes(found.id)) {
        const indexToRemove = expressIDMontados.indexOf(found.id);
        if (indexToRemove !== -1) {
          expressIDMontados.splice(indexToRemove, 1);
        }
        expressIDNoMontados.push(found.id);
      } else if (expressIDNoMontados.includes(found.id)) {
        const indexToRemove = expressIDNoMontados.indexOf(found.id);
        if (indexToRemove !== -1) {
          expressIDNoMontados.splice(indexToRemove, 1);
        }
        expressIDMontados.push(found.id);
      }

      let btnCamActivoNumero = [];
        var camActivos = document.querySelectorAll('.btnNumCamion');

        // Iterar a través de los botonesCamiones activos y obtiene 
        camActivos.forEach(function(camActivo) {
            // Verificar si el elemento tiene la clase "active"
            if (camActivo.classList.contains('active')) {
              btnCamActivoNumero.push(parseInt(camActivo.textContent));
            }
        });
        console.log(btnCamActivoNumero);

        if(btnCamActivoNumero.length>0){
          const expressIDsCamActivo = [];
          for (var i = 0; i < precastElements.length; i++) {
            if (btnCamActivoNumero.includes(precastElements[i].Camion))  {
                expressIDsCamActivo.push(precastElements[i].expressID);
            }
          }
          console.log("Express de los camiones activos"+expressIDsCamActivo)

          let visiblesIdsV = expressIDsCamActivo.filter(id => expressIDMontados.includes(id));
          let visiblesIdsR = expressIDsCamActivo.filter(id => expressIDNoMontados.includes(id));
          console.log("VISIBLES EN ROJO: "+visiblesIdsR)
          console.log("VISIBLES EN VERDE: "+visiblesIdsV)
          
        if (visiblesIdsV.length > 0 && visiblesIdsR.length > 0 ) {
          try{
            hideAllItems2(viewer, expressIDsCamActivo, 'montaje-verde', materialVerde);
          } catch(error){
            console.log(error)
          }
          try{
            hideAllItems2(viewer, expressIDsCamActivo, 'montaje-rojo', materialRojo);
          }catch(error){
            console.log(error)
          }
        }else if (visiblesIdsV.length === 0 && visiblesIdsR.length > 0) {
          
          try{
            hideAllItems2(viewer, expressIDsCamActivo, 'montaje-rojo', materialRojo);
          } catch(error){
            console.log(error)
          }
        }else if (visiblesIdsV.length > 0 && visiblesIdsR.length === 0) {
          try{
            hideAllItems2(viewer, expressIDsCamActivo, 'montaje-verde', materialVerde);
          }catch(error){
            console.log(error)
          }
        }
        
          subsetVerde=getWholeSubsetColorVerde(viewer, model, visiblesIdsV);
          replaceOriginalBySubset(viewer);
          subsetRojo=getWholeSubsetColorRojo(viewer, model, visiblesIdsR);
          replaceOriginalBySubset(viewer);
          items = viewer.context.items;   
          if(items){
            if(subset){
              items.ifcModels = items.ifcModels.filter(s=>s !== subset)
              items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subset) 
            }
            if(subsetVerde){
              items.ifcModels.push(subsetVerde); 
              items.pickableIfcModels.push(subsetVerde);
            }
            if(subsetRojo){
              items.ifcModels.push(subsetRojo); 
              items.pickableIfcModels.push(subsetRojo);
            }
          }
          return;
        }
        
    }
    
    document.getElementById("estadoPieza").click();
    document.getElementById("estadoPieza").click();
  }else{
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

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const propButton = document.getElementById('btn-lateral-propiedades');
let propActive= false;
const divInputText= document.getElementById("inputARTP");
const inputText = document.querySelector("#inputARTP input[type='text']");
const checkBox = document.getElementById('checkLabels'); 
const infoBusquedas = document.getElementById("infoBusquedas");
propButton.onclick= () => {
  if(propActive){
    propActive=!propActive;
    propButton.classList.remove('active');
    const propiedadesContainer = document.getElementById('propiedades-container');
    propiedadesContainer.innerHTML = '';
    viewer.IFC.selector.unpickIfcItems();
    divInputText.style.display = "none";
    inputText.value="";
    hideAllItems(viewer, idsTotal);
    showAllItems(viewer, allIDs);
    ocultarLabels();
    expressIDsInput=[];
        numBusquedas=0;
        infoBusquedas.querySelector("p").textContent = "";
        if (listaElementosEncontrados) {
            infoBusquedas.removeChild(listaElementosEncontrados);
            listaElementosEncontrados = null;
            scene.remove(modelCopyCompleto); 
        }
        return;
  }else {
    propActive=!propActive;
    propButton.classList.add('active');
    divInputText.style.display = "block";
    inputText.focus();

    // compruebasi existen botones activos en divNumCamiones
    const divNumCamiones = document.getElementById('divNumCamiones');
    const activeButtons = divNumCamiones.querySelectorAll('.active');
    activeButtons.forEach(button => {
      button.click(); 
    });
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
      color: 0x54a2c4,
  });
modelCopyCompleto = new Mesh(model.geometry, materialSolid);
        scene.add(modelCopyCompleto);
}

// Seccion button - corte
const cutButton = document.getElementById('btn-lateral-seccion');
let cutActive = false;
cutButton.onclick = () => {
  
    if(cutActive) {
        cutActive = !cutActive;
        cutButton.classList.remove('active');
        viewer.clipper.deleteAllPlanes();
        planoCorteCont=0;
    } else {
        cutActive = !cutActive;
        cutButton.classList.add('active');
        viewer.clipper.active = cutActive;
    };
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
    if (measuresActive) {
      viewer.dimensions.create();
    }
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

//Measure button
// Dimensions button
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

// Floorplans button
let floorplansActive = false;
const floorplanButton = document.getElementById('btn-lateral-plantas');
let floorplansButtonContainer = document.getElementById('button-container');
floorplanButton.onclick = () => {
  
  if(floorplansActive) {
    floorplansActive = !floorplansActive;
    floorplanButton.classList.remove('active');
    floorplansButtonContainer.classList.remove('visible');
    
    hideAllItems(viewer, idsTotal );
      showAllItems(viewer, idsTotal);
    floorplansButtonContainer.style.visibility = 'hidden';
 
    hideAllItems(viewer, idsTotal );
      showAllItems(viewer, idsTotal);
    //desactiva los botones de plantas cuando se apaga el boton que genera los planos
    const containerForButtons = document.getElementById('button-container');
    const buttons = containerForButtons.querySelectorAll('button');
    for (const button of buttons) {
      if (button.classList.contains('activo')) {
        button.classList.remove('activo');
      }
    }
    ocultaBtnRemoveClass();
    ocultarLabels();
    
  } else {
    floorplansActive = !floorplansActive;
    floorplanButton.classList.add('active');
    floorplansButtonContainer = document.getElementById('button-container');
    floorplansButtonContainer.style.visibility = 'visible';
    
  };
};

// Ifc en modo fantasma
// Muestra el ifc COmpleto
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

let expressIDMontados=[];
let btnEstadoMontaje = document.getElementById('estadoPieza');
let subsetRojo=null;
let subsetVerde=null;

//TODO: clic en BTN ESTADO PIEZA
btnEstadoMontaje.onclick=async()=>{
  btnEstadoMontaje.classList.toggle('active');
  viewer.IFC.selector.unpickIfcItems();

  // comprueba el estado de los checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const checkedArtPiezas = [];

  for (let i = 0; i < checkboxes.length; i++) {
    const isChecked = checkboxes[i].checked;
    const artPieza = checkboxes[i].getAttribute('data-art-pieza');

    if (isChecked) {
      checkedArtPiezas.push(artPieza);
    }
  }
  console.log(checkedArtPiezas+" CHECKEADOS")

  const elVisiblesCheck = [];
  for (let i = 0; i < precastElements.length; i++) {
    const elemento = precastElements[i];

    // Obtiene la primera letra de ART_Pieza
    const primeraLetra = elemento.ART_Pieza.charAt(0);

    // Comprueba si la primera letra de ART_Pieza está en checkedArtPiezas
    if (checkedArtPiezas.includes(primeraLetra)) {
      elVisiblesCheck.push(elemento.expressID);
    }
  }
  console.log("ID DE ELEMENTOS CHECK: "+elVisiblesCheck);

  if (btnEstadoMontaje.classList.contains('active' )) {
    const elVisiCheckMontados = elVisiblesCheck.filter((element) =>
      expressIDMontados.includes(element)
    );

    const elVisiCheckNoMontados = elVisiblesCheck.filter((element) =>
      expressIDNoMontados.includes(element)
    );

    if(subset){
     // activaCheck();
      subset.removeFromParent();
      const items = viewer.context.items;   
      items.ifcModels = items.ifcModels.filter(s=>s !== subset)
      items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subset)
    }
    console.log("Creando subconjuntoRojo: " +expressIDNoMontados, expressIDNoMontados.length);
    console.log("Creando subconjuntoVerde: " +expressIDMontados, expressIDMontados.length);
    subsetVerde=getWholeSubsetColorVerde(viewer, model, elVisiCheckMontados);
    replaceOriginalBySubset(viewer);
    subsetRojo=getWholeSubsetColorRojo(viewer, model, elVisiCheckNoMontados);
    replaceOriginalBySubset(viewer);
    
  } else {
    if(subsetRojo){
      subsetRojo.removeFromParent();
      const items = viewer.context.items;   
      items.ifcModels = items.ifcModels.filter(s=>s !== subsetRojo)
      items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subsetRojo)
    }
    if(subsetVerde){
      subsetVerde.removeFromParent();
      const items = viewer.context.items;   
      items.ifcModels = items.ifcModels.filter(s=>s !== subsetVerde)
      items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subsetVerde)
    }
    console.log("Despulsando:" +allIDs, allIDs.length);
    scene.add(subset);
    replaceOriginalModelBySubset(viewer, model, subset);
    hideAllItems(viewer,allIDs)
    showAllItems(viewer, elVisiblesCheck)
  }

  
    // Obtén el elemento con el ID divNumCamiones
  const divNumCamiones = document.getElementById('divNumCamiones');

  // Obtén todos los elementos con la clase 'active' dentro de divNumCamiones
  const btnCamionActivos = divNumCamiones.querySelectorAll('.active');

  // Recorre los elementos activos y recoge su texto
  const textosCamionesActivos = [];
  btnCamionActivos.forEach((elemento) => {
    textosCamionesActivos.push(parseInt(elemento.textContent));
  });
  console.log("LOS BOTONES ACTIVOS DE LOS CAMIONES: "+textosCamionesActivos);
  const expressIDsCaminonesActivos = [];
  if(textosCamionesActivos.length>0){ 
    precastElements.forEach(function(precastElement) {
      if (textosCamionesActivos.includes(parseInt(precastElement.Camion))) {
        expressIDsCaminonesActivos.push(precastElement.expressID);
      }
    });
    let visiblesIdsV = expressIDsCaminonesActivos.filter(id => expressIDMontados.includes(id));
          let visiblesIdsR = expressIDsCaminonesActivos.filter(id => expressIDNoMontados.includes(id));

          let activeExpressIDsR = activeExpressIDs.filter(id => expressIDNoMontados.includes(id));
          let activeExpressIDsV = activeExpressIDs.filter(id => expressIDMontados.includes(id));

          if (visiblesIdsV.length > 0 && visiblesIdsR.length > 0 ) {
            try{
              hideAllItems2(viewer, expressIDs, 'montaje-verde', materialVerde);
            } catch(error){
              console.log(error)
            }
            try{
              hideAllItems2(viewer, expressIDs, 'montaje-rojo', materialRojo);
            }catch(error){
              console.log(error)
            }
          }else if (visiblesIdsV.length === 0 && visiblesIdsR.length > 0) {
            
            try{
              hideAllItems2(viewer, expressIDs, 'montaje-rojo', materialRojo);
            } catch(error){
              console.log(error)
            }
          }else if (visiblesIdsV.length > 0 && visiblesIdsR.length === 0) {
            try{
              hideAllItems2(viewer, expressIDs, 'montaje-verde', materialVerde);
            }catch(error){
              console.log(error)
            }
          }


          
          console.log("Creando subconjuntoRojo: " +visiblesIdsV, visiblesIdsV.length);
            console.log("Creando subconjuntoVerde: " +visiblesIdsR, visiblesIdsR.length);
            subsetVerde=getWholeSubsetColorVerde(viewer, model, activeExpressIDsV);
            replaceOriginalBySubset(viewer);
            subsetRojo=getWholeSubsetColorRojo(viewer, model, activeExpressIDsR);
            replaceOriginalBySubset(viewer);
          items = viewer.context.items;   
          if(items){
            items.ifcModels = items.ifcModels.filter(s=>s !== subset)
            items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subset)
            items.ifcModels.push(subsetVerde); 
            items.pickableIfcModels.push(subsetVerde);
            items.ifcModels.push(subsetRojo); 
            items.pickableIfcModels.push(subsetRojo);
          }
  }
};


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

window.onclick = async () => {
    // if(cutActive) {
    //     viewer.clipper.createPlane();
    // }else 
    if (measuresActive){
        viewer.dimensions.create();
    }
};

//*********************************************************************************************************** */


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
        scene.add(labelObject);
    }
  }
}

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


//TODO CHECKBOXES
const checkboxStates = {};
function addCheckboxListeners(precastElements, viewer) {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener('change', function() {
      viewer.IFC.selector.unpickIfcItems();
      const isChecked = this.checked;
      const artPieza = this.getAttribute('data-art-pieza');
      checkboxStates[artPieza] = this.checked;
      const visibleIds = [];
      const parentText = this.parentNode.textContent.trim();
      const letter = parentText.charAt(0).toUpperCase();
      
      precastElements.forEach(function(el) {
        if (el.ART_Pieza && el.ART_Pieza.charAt(0).toUpperCase() === artPieza) {
          visibleIds.push(el.expressID);
        }
      });
      console.log("Elementos visibles en el check: "+visibleIds);
      if (isChecked) {
        
          if (document.getElementById("estadoPieza").classList.contains("active")) {
              let visiblesIdsV = visibleIds.filter(id => expressIDMontados.includes(id));
              let visiblesIdsR = visibleIds.filter(id => expressIDNoMontados.includes(id));

              if (visiblesIdsV.length > 0 && visiblesIdsR.length > 0) {
                  showAllItems2(viewer, visiblesIdsV, 'montaje-verde', materialVerde);
                  showAllItems2(viewer, visiblesIdsR, 'montaje-rojo', materialRojo);
              } else if (visiblesIdsV.length === 0 && visiblesIdsR.length > 0) {
                  showAllItems2(viewer, visiblesIdsR, 'montaje-rojo', materialRojo);
              } else if (visiblesIdsV.length > 0 && visiblesIdsR.length === 0) {
                  showAllItems2(viewer, visiblesIdsV, 'montaje-verde', materialVerde);
              } 
          }else {
            showAllItems(viewer, visibleIds );
          }
      } else {
        if (!document.getElementById("estadoPieza").classList.contains("active")) {
        
          hideAllItems(viewer, visibleIds);
          removeLabels(visibleIds);
          const button = document.querySelector(`.btnCheck[data-art-pieza="${artPieza}"]`);
          if (button && button.classList.contains('pulsado')) {
              button.classList.remove('pulsado');
              removeLabels(visibleIds);
          }
        }
        if (document.getElementById("estadoPieza").classList.contains("active")) {
          let visiblesIdsV = visibleIds.filter(id => expressIDMontados.includes(id));
          let visiblesIdsR = visibleIds.filter(id => expressIDNoMontados.includes(id));

          if (visiblesIdsV.length > 0 && visiblesIdsR.length > 0 ) {
            try{
              hideAllItems2(viewer, visibleIds, 'montaje-verde', materialVerde);
            } catch(error){
              console.log(error)
            }
            try{
              hideAllItems2(viewer, visibleIds, 'montaje-rojo', materialRojo);
            }catch(error){
              console.log(error)
            }
          }else if (visiblesIdsV.length === 0 && visiblesIdsR.length > 0) {
            
            try{
              hideAllItems2(viewer, visibleIds, 'montaje-rojo', materialRojo);
            } catch(error){
              console.log(error)
            }
          }else if (visiblesIdsV.length > 0 && visiblesIdsR.length === 0) {
            try{
              hideAllItems2(viewer, visibleIds, 'montaje-verde', materialVerde);
            }catch(error){
              console.log(error)
            }
          }
          // const items = viewer.context.items;   
          // if(items){
          //   items.ifcModels = items.ifcModels.filter(s=>s !== subset)
          //   items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subset)
          //   items.ifcModels.push(subsetVerde); 
          //   items.pickableIfcModels.push(subsetVerde);
          //   items.ifcModels.push(subsetRojo); 
          //   items.pickableIfcModels.push(subsetRojo);
          // }
          removeLabels(visibleIds);
          const button = document.querySelector(`.btnCheck[data-art-pieza="${artPieza}"]`);
          if (button && button.classList.contains('pulsado')) {
              button.classList.remove('pulsado');
              removeLabels(visibleIds);
          }
        }
      }
      document.getElementById("estadoPieza").click();
      document.getElementById("estadoPieza").click();
    });
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

let botonesActivos; 
function generaBotonesNumCamion(camionesUnicos) {
  viewer.IFC.selector.unpickIfcItems();

  const btnNumCamiones = document.getElementById("divNumCamiones");
  botonesActivos = 0; // contador de botones activos

  btnNumCamiones.innerHTML = ""; // limpia el div antes de generar los botones
  agregarBotonCero();
  camionesUnicos.sort((a, b) => a - b); // ordena los nº de camion de menor a mayor

  const checkboxGroup = document.getElementsByClassName("checkbox-group");

  camionesUnicos.forEach(function(camion) {
    const btn = document.createElement("button");
    btn.setAttribute("class", "btnNumCamion");
    btn.textContent = camion;

    precastElements.forEach(function(precastElement) {
      if (parseInt(precastElement.Camion) === camion) {
        const tipoTransporte = precastElement.tipoTransporte;
        if (tipoTransporte.includes("E")) {
          btn.style.backgroundColor = "#6d4c90";
        } else if (tipoTransporte.includes("A")) {
          btn.style.backgroundColor = "#4c7a90";
        } else if (tipoTransporte.includes("C")) {
          btn.style.backgroundColor = "#90834c";
        }else if (tipoTransporte.includes("Tu")) {
          btn.style.backgroundColor = "#9e9e9e";
      }
      }
    });

    btnNumCamiones.appendChild(btn);

    //TODO: Boton Camion
    btn.addEventListener("click", function() {

      const btnEstadoPieza= document.getElementById("estadoPieza");
      const btnEstadoActivo = btnEstadoPieza.classList.contains("active");
      
      if(!btnEstadoActivo){
        btnEstadoPieza.onclick();
        let containerCheck= document.getElementById("checkbox-container");
        containerCheck.style.visibility="hidden";
      }

      //almacena el estado de los check en el momento de pulsar un botonNumCamion
      let checkboxStates = {};
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(function (checkbox) {
                checkboxStates[checkbox.id] = checkbox.checked;
            });
      const expressIDs = [];
      //si el btnNumCamion es pulsado, los expressID que tengan ese numCamion se añaden a expressID
      precastElements.forEach(function(precastElement) {
        if (parseInt(precastElement.Camion) === camion) {
          expressIDs.push(precastElement.expressID);
        }
      });
      //let items;
      const isActive = btn.classList.contains("active");
      //si btnNumCamion esta activo, borde rojo
      if (isActive) {
          viewer.IFC.selector.unpickIfcItems();
          activeExpressIDs = activeExpressIDs.filter(id => !expressIDs.includes(id));
          btn.classList.remove("active");
          btn.style.justifyContent = "center";
          btn.style.color = "";
          botonesActivos--;
          removeLabels(expressIDs);
     
          let visiblesIdsV = activeExpressIDs.filter(id => expressIDMontados.includes(id));
          let visiblesIdsR = activeExpressIDs.filter(id => expressIDNoMontados.includes(id));
            
            if (visiblesIdsV.length > 0 && visiblesIdsR.length > 0) {

              try{
                hideAllItems2(viewer, allIDs,'montaje-rojo', materialRojo)
              }catch(error){
                console.log(error)
              }

              try{
                hideAllItems2(viewer, allIDs,'montaje-verde', materialVerde)
              }catch(error){
                console.log(error)
              }
              showAllItems2(viewer, visiblesIdsV, 'montaje-verde', materialVerde);
              showAllItems2(viewer, visiblesIdsR, 'montaje-rojo', materialRojo);

            } else if (visiblesIdsV.length === 0 && visiblesIdsR.length > 0) {

              try{
                hideAllItems2(viewer, allIDs,'montaje-rojo', materialRojo)
              }catch(error){
                console.log(error)
              }

              try{
                hideAllItems2(viewer, allIDs,'montaje-verde', materialVerde)
              }catch(error){
                console.log(error)
              }

                showAllItems2(viewer, visiblesIdsR, 'montaje-rojo', materialRojo);
                
            } else if (visiblesIdsV.length > 0 && visiblesIdsR.length === 0) {
                
              try{
                hideAllItems2(viewer, allIDs,'montaje-rojo', materialRojo)
              }catch(error){
                console.log(error)
              }

              try{
                hideAllItems2(viewer, allIDs,'montaje-verde', materialVerde)
              }catch(error){
                console.log(error)
              }
                showAllItems2(viewer, visiblesIdsV, 'montaje-verde', materialVerde);
            }  
        //si btnNumCamion se pulsa y no esta activo, borde rojo
      } else {
          botonesActivos++;
          const btnCheckPulsado = document.querySelectorAll('.btnCheck.pulsado');
                btnCheckPulsado.forEach(function(btn) {
                btn.classList.remove('pulsado');
          });
          const piezaLabels = document.querySelectorAll('.pieza-label');
                piezaLabels.forEach(function(label) {
                    label.style.visibility = 'hidden';
                });
          let btnEstadoPieza=document.getElementById("estadoPieza");     
          activeExpressIDs = activeExpressIDs.concat(expressIDs);
          viewer.IFC.selector.unpickIfcItems();
          btn.classList.add("active");
          btn.style.color = "red";
          
          generateLabels(activeExpressIDs);  
          if(!btnEstadoPieza.classList.contains('active')){
            hideAllItems(viewer, allIDs);
            showAllItems(viewer, activeExpressIDs);
          } 
          else{  // el btnNum esta pulsado y el btnEstadoPieza tambien
            const elVisiCheckMontados = activeExpressIDs.filter((element) =>
            expressIDMontados.includes(element)
            ); //Array con elementos visibles + Montados = visibles son los que pertenecen a un tipo y coinciden con los Montados, 

            const elVisiCheckNoMontados = activeExpressIDs.filter((element) =>
              expressIDNoMontados.includes(element)
            );
            if(subset){
                subset.removeFromParent();
                const items = viewer.context.items;   
                items.ifcModels = items.ifcModels.filter(s=>s !== subset)
                items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subset)
            }
            if(subsetRojo){
              subsetRojo.removeFromParent();
              const items = viewer.context.items;   
              items.ifcModels = items.ifcModels.filter(s=>s !== subsetRojo)
              items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subsetRojo)
            }  
            if(subsetVerde){
              subsetVerde.removeFromParent();
              const items = viewer.context.items;   
              items.ifcModels = items.ifcModels.filter(s=>s !== subsetVerde)
              items.pickableIfcModels = items.pickableIfcModels.filter(s=>s !== subsetVerde)
            }
            
          console.log("Creando subconjuntoRojo: " +elVisiCheckNoMontados, elVisiCheckMontados.length);
          console.log("Creando subconjuntoVerde: " +elVisiCheckMontados, elVisiCheckMontados.length);
          subsetVerde=getWholeSubsetColorVerde(viewer, model, elVisiCheckMontados);
           (viewer);
          subsetRojo=getWholeSubsetColorRojo(viewer, model, elVisiCheckNoMontados);
          replaceOriginalBySubset(viewer);
            
          }
      }

      

      if (botonesActivos === 0) {
        // showAllItems(viewer, allIDs);
        ocultarLabels();
        const estadoPieza = document.getElementById("estadoPieza");
        if (!estadoPieza.classList.contains("active")) {
            const containerFiltros= document.getElementById("checkbox-container");
            containerFiltros.style.visibility="visible";
            const checkedArtPiezas = []; 
            checkboxes.forEach(function (checkbox) {
                if (checkbox.checked) {
                      checkedArtPiezas.push(checkbox.getAttribute('data-art-pieza'));
                }
            });
            const matchingIds = []; // Almacenar los IDs de los elementos que coinciden con los checkboxes seleccionados
                    
            precastElements.forEach(function (element) {
                if (element.ART_Pieza === 0 || element.ART_Pieza === "0" || element.ART_Pieza === "" || element.ART_Pieza === undefined) {
                  return;
                }
                if (checkedArtPiezas.includes(element.ART_Pieza.charAt(0).toUpperCase())) {
                    matchingIds.push(element.expressID);                        
                }
            });
            hideAllItems(viewer, idsTotal );
            showAllItems(viewer, matchingIds);
        }
        else{
          const containerFiltros= document.getElementById("checkbox-container");
          containerFiltros.style.visibility="visible";
          let visiblesIdsV = expressIDs.filter(id => expressIDMontados.includes(id));
          let visiblesIdsR = expressIDs.filter(id => expressIDNoMontados.includes(id));
          try{
            hideAllItems2(viewer, expressIDs, 'montaje-rojo', materialRojo);
          } catch(error){
            console.log(error)
          }
          try{
          hideAllItems2(viewer, expressIDs, 'montaje-verde', materialVerde);
          } catch(error){
            console.log(error)
          }
          try{
            showAllItems2(viewer, visiblesIdsR, 'montaje-rojo', materialRojo);
          } catch(error){
            console.log(error)
          }
          try{
            showAllItems2(viewer, visiblesIdsV, 'montaje-verde', materialVerde);
          } catch(error){
            console.log(error)
          }
          document.getElementById("estadoPieza").click();
          document.getElementById("estadoPieza").click();
        }
        
      } else {
        const containerFiltros= document.getElementById("checkbox-container");
        containerFiltros.style.visibility="hidden";
        
      }
    });
  });
}

let activeExpressIDs = [];
function obtenerValorCamion(precastElements) {
  const valoresCamion = new Set();
  
  precastElements.forEach(function(elemento) {
      const camion = parseInt(elemento.Camion);
      if (!isNaN(camion)) { // Agregar solo valores numéricos al Set
          valoresCamion.add(camion);
      }
  });
  return Array.from(valoresCamion);
}

function hideAllItems(viewer, ids) {
  viewer.IFC.loader.ifcManager.removeFromSubset(
      0,
      ids,
      'full-model-subset',
  );
}

function hideAllItems2(viewer, ids, customID, material) {
  viewer.IFC.loader.ifcManager.removeFromSubset(
      0,
      ids,
      customID,
      material,
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

function showAllItems2(viewer, ids, customID, material) {
	viewer.IFC.loader.ifcManager.createSubset({
		modelID: 0,
		ids,
		removePrevious: false,
		applyBVH: true,
		customID: customID,
    material: material,
	});
}

let btnCero
function agregarBotonCero() {
  viewer.IFC.selector.unpickIfcItems();
  
  btnCero = document.createElement("button");
  btnCero.setAttribute("class","btnNumCamion")
  
  divNumCamiones.appendChild(btnCero);

  const iconoPlay = document.createElement("i");
  iconoPlay.setAttribute("class", "fas fa-play");

  btnCero.appendChild(iconoPlay);

  btnCero.addEventListener("click", function() {

      const isActive = btnCero.classList.contains("active");
      if (isActive) {
          hideAllItems(viewer, idsTotal);
          showAllItems(viewer, allIDs);
          btnCero.classList.remove("active");
          btnCero.style.justifyContent = "center";
          btnCero.style.color = "";
      } else {
          ocultarLabels();
          hideAllItems(viewer, idsTotal);
          const botones = document.querySelectorAll('#divNumCamiones button');

          botones.forEach(function(boton) {
              boton.classList.remove('active');
              boton.style.border = '1px solid white';
              boton.style.color="white";
          });
          btnCero.classList.add("active");
          btnCero.style.justifyContent = "center";
          showElementsByCamion(viewer, precastElements);
      }
  });
}

function showElementsByCamion(viewer, precastElements) {
  // Crear el div y label
  activeExpressIDs = [];
  botonesActivos=0;
  const label = document.createElement("label");
  const div = document.createElement("div");
  div.setAttribute("id", "divNumCamion");
  div.appendChild(label);
  document.body.appendChild(div);

  // Filtra los elementos cuyo valor en su propiedad sea distinto a 0 o a undefined
  //O los que no tengan propiedad asiganada en el objeto
  const filteredElements = precastElements.filter((element) => {
      const { Camion } = element;
      return Camion && Camion !== "" && Camion !== "undefined" && Camion !== "0" && "Camion" in element;
  });
  
  // Agrupa los elementos por valor de su propiedad
  const groupedElements = filteredElements.reduce((acc, element) => {
      const { Camion } = element;
      if (!acc[Camion]) {
          acc[Camion] = [];
      }
      acc[Camion].push(element);
      return acc;
  }, {});
  
  // muestra los elementos agrupados en el visor y su etiqueta de num Camion
  let delay = 0;
  Object.keys(groupedElements).forEach((key) => {
      const elements = groupedElements[key];
      setTimeout(() => {
          // Mostrar el valor de Camion en el label
          label.textContent = `Camion: ${key}`;
          showAllItems(viewer, elements.map((element) => element.expressID));
      }, delay);
    delay += 350; // Esperar un segundo antes de mostrar el siguiente grupo
  });

   //ocultar la etiqueta después de mostrar todos los elementos
  setTimeout(() => {
    if (btnCero.classList.contains("active")) {
      btnCero.classList.remove("active");
      

      let checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
      checkboxes.forEach(function(checkbox) {
          checkbox.checked = true;
      });

      let elementos = document.querySelectorAll('.btnCheck.pulsado');

      elementos.forEach(function(elemento) {
        elemento.classList.remove('pulsado');
      });
    }
    div.style.visibility="hidden"

  }, delay);
}
//*********************************************************************************************************** */