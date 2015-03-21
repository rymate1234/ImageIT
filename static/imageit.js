
// Add the paste event listener
window.addEventListener("paste", handlePaste);

/* Handle paste events */
function handlePaste(e) {
    // We need to check if event.clipboardData is supported (Chrome)
    if (e.clipboardData) {
        // Get the items from the clipboard
        var items = e.clipboardData.items;
        if (items) {
            // Loop through all items, looking for any kind of image
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    // We need to represent the image as a file,
                    var blob = items[i].getAsFile();
                    // and use a URL or webkitURL (whichever is available to the browser)
                    // to create a temporary URL to the object
                    var URLObj = window.URL || window.webkitURL;
                    var source = URLObj.createObjectURL(blob);

                    // The URL can then be used as the source of an image
                    uploadFile(blob);
                }
            }
        }
        // If we can't handle clipboard data directly (Firefox),
        // we need to read what was pasted from the contenteditable element
    } else {
        // This is a cheap trick to make sure we read the data
        // AFTER it has been inserted.
        console.log("Getting image from contenteditable");
        setTimeout(checkInput, 1);
    }
}

/* Parse the input in the paste catcher element */
function checkInput() {
   // Store the pasted content in a variable
   var child = pasteCatcher.childNodes[0];
 
   // Clear the inner html to make sure we're always
   // getting the latest inserted content
   pasteCatcher.innerHTML = "";
    
   if (child) {
      // If the user pastes an image, the src attribute
      // will represent the image as a base64 encoded string.
      if (child.tagName === "IMG") {
        console.log("Got an image from contenteditable");
        createImage(child);
      }
   }
}
 
/* Creates a new image from a given source */
function createImage(source) {
    source.crossOrigin = 'Anonymous';
    console.log("Converting image to blob");
    var blob = dataUriToBlob(source.src);
    uploadFile(blob); 
}


function dataUriToBlob(dataURI) {
    // serialize the base64/URLEncoded data
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURI.split(',')[1]);
    } else {
        byteString = unescape(dataURI.split(',')[1]);
    }

    // parse the mime type
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // construct a Blob of the image data
    var array = [];
    for (var i = 0; i < byteString.length; i++) {
        array.push(byteString.charCodeAt(i));
    }
    return new Blob(
        [new Uint8Array(array)], {
            type: mimeString
        }
    );
}

function uploadFile(file) {
    var xhr = new XMLHttpRequest();
  
    document.getElementById("jumbotron").innerHTML = "<IMG SRC='http://images.rymate.co.uk/images/4jBHzKl.png'></img>";

    xhr.upload.onprogress = function (e) {
        //$(".progress").show();
        var percentComplete = Math.ceil((e.loaded / e.total) * 100);
        //$("#info_text").text("Uploaded: " + percentComplete + "%");
        //$('.bar').width(percentComplete + "%");
        console.log("Uploaded: " + percentComplete + "%");
    };

    xhr.onload = function () {
        if (xhr.status == 200) {
            if (top.window) {
                console.log("window is avaliable");
            }
            console.log( "Window.location is " + top.window.location);
            addUploadedImage(xhr.response);
            top.window.location.hash = xhr.response;
        } else if (xhr.status == 413) {
            alert("The image is too large! It must be 25MB or less.");
        } else {
            alert("Something went wrong whilst uploading. This is probably a bug, so it'll be fixed soon!");
        }
    };

    xhr.onerror = function () {
        alert("Error! Upload failed. Can not connect to server.");
    };

    xhr.open("POST", "/upload", true);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
}

function addUploadedImage(imageId) {
    var xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (xhr.status == 200) {
            if (localStorage.image_list) {
                image_list = JSON.parse(localStorage.image_list);
                image_list.push({filename: xhr.response});
                localStorage.image_list = JSON.stringify(image_list);
            } else {
                image_list = [];
                image_list.push({filename: xhr.response});
                localStorage.image_list = JSON.stringify(image_list);
            }
        }
    };

    xhr.open("GET", "/get-filename/" + imageId, true);
    xhr.send();
}