var renderFormGlobal;
var adminFormSchemaList = {};
var adminFormSchemaUIList = {};

function adminFormReady(t) {
    function adminForm(item) {
        var formData = {};
        var Form = JSONSchemaForm.default;
        var drawSquareInterface = function(formData, prefix, div, idBtnSetPrefix, idBtnDelPrefix, btnSetClass, btnDelClass) {
            var nbLine = 4;
            var colcount = 0;
            var dataContent = '';
            div.innerHTML = dataContent;
            document.getElementById(prefix + "form").style.display = "none";
            document.getElementById(prefix + "table").style.display = "block";
            for (var i = 0; i < formData.data.length; i++) {
                if (colcount == 0) {
                    dataContent = dataContent + '<div class="row">';
                }
                dataContent = dataContent + '<div class="col-md-2 squareAdmin" id="' + formData.data[i].id + '" >';
                if (formData.data[i].icon && formData.data[i].icon.icon) {
                    dataContent = dataContent + '<div><i class="fa sensorIcon" data-unicode="' + formData.data[i].icon.icon + '">&#x' + formData.data[i].icon.icon + '</i></div>';
                }
                dataContent = dataContent + '<div class="squareAdminText">' + formData.data[i].name + '</div>';
                dataContent = dataContent + '<div>';
                dataContent = dataContent + "<button type=\"button\" class=\"" + btnSetClass + " btn btn-primary btn-sm\" id=\"" + idBtnSetPrefix + formData.data[i].id + "\"> <span class=\"glyphicon glyphicon-pencil\"></span>";
                dataContent = dataContent + "<button type=\"button\" class=\"" + btnDelClass + " btn btn-danger btn-sm\" id=\"" + idBtnDelPrefix + formData.data[i].id + "\"> <span class=\"glyphicon glyphicon-trash\"></span>";
                dataContent = dataContent + '</div>';
                dataContent = dataContent + '</div>';
                colcount++;
                if (colcount == 5) {
                    dataContent = dataContent + '</div>';
                    colcount = 0;
                }
            }
            if (colcount != 0) {
                dataContent = dataContent + '</div>';
            }

            div.innerHTML = dataContent;

            $("." + btnSetClass).unbind();
            $("." + btnSetClass).on("click", function(e) {
                if (event.target.tagName.toLowerCase() === "span") {
                    targetId = event.target.parentNode.id.replace(btnSetClass, "");
                } else {
                    targetId = event.target.id.replace(btnSetClass, "");
                }

                for (var i = 0 ; i < formData.data.length ; i++) {
                    if (parseInt(formData.data[i].id) === parseInt(targetId)) {
                        renderForm(prefix, div, formData.schema, formData.schemaUI, formData.data[i]);
                    }
                }
            });

            $("." + btnDelClass).unbind();
            $("." + btnDelClass).on("click", function(e) {
                if (event.target.tagName.toLowerCase() === "span") {
                    targetId = event.target.parentNode.id.replace(btnDelClass, "");
                } else {
                    targetId = event.target.id.replace(btnDelClass, "");
                }

                for (var i = 0 ; i < formData.data.length ; i++) {
                    if (parseInt(formData.data[i].id) === parseInt(targetId)) {
                        swal(Object.assign({
                            title: t("js.delete.confirm"),
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonText: t("js.continue"),
                            cancelButtonText: t("js.cancel"),
                            showLoaderOnConfirm: true
                        }, swalDefaults)).then(function() {
                            // Confirm
                            $.ajax({
                                type: "DELETE",
                                url: vUrl + "conf/" + item + "/del/" + targetId +"/",
                                data: {
                                    u: username,
                                    p: password
                                }
                            }).done(function(data) {
                                loadTiles(prefix);
                            }).fail(function(msg) {
                                setError(msg);
                            });
                        }, function(mode) {
                            // Cancel
                            if (mode && mode != "cancel") {
                                return;
                            }
                        });
                    }
                }
            });
        }

        var renderForm = function(prefix, tableDiv, schema, uiSchema, formData) {
            tableDiv.style.display = "none";
            document.getElementById(prefix + "form").style.display = "block";
            document.getElementById("add" + prefix).style.display = "none";
            var self = this;
            ReactDOM.render(React.createElement(Form, {schema:schema, uiSchema:uiSchema, formData:formData, onSubmit: function(data) {
                $.ajax({
                    type: "POST",
                    url: vUrl + "conf/" + prefix + "/set/",
                    contentType: "application/json",
                    data: JSON.stringify({
                        u: username,
                        p: password,
                        data: data.formData
                    })
                }).done(function(data) {
                    document.getElementById(prefix + "form").style.display = "none";
                    tableDiv.style.display = "block";
                    loadTiles(prefix);
                    $(".selectpicker").selectpicker("destroy");
                }).fail(function(msg) {
                    setError(msg);
                    $(".selectpicker").selectpicker("destroy");
                });
            }},
            React.createElement(
              "button",
              { type: "button", className:"btn btn-info", onClick: function() {
                  loadTiles(prefix);
                  $(".selectpicker").selectpicker("destroy");
              }},
              t("button.cancel")
          ),
            React.createElement(
              "button",
              { type: "submit", className:"btn btn-success" },
              t("button.save")
            )), document.getElementById(prefix + "form"));

            var htmlForm = document.getElementById(prefix + "form");//.innerHTML;
            var selects = htmlForm.getElementsByTagName("select");

            if (htmlForm && selects) {
                for (i=0 ; i < selects.length ; i++) {
                    var select = selects[i];
                    select.classList.add("selectpicker");
                    select.classList.add("show-tick");
                    select.setAttribute("data-live-search", "true");
                    // Icons !
                    if (select.id == "root_icon_icon") {
                        var sheet = window.document.styleSheets[0];
                        var options = select.getElementsByTagName("option");
                        for (j=0 ; j < options.length ; j++) {
                            var option = options[j];
                            var val = option.value;
                            var cssClass = 'icon-' + val;
                            var cssRulesStringified = JSON.stringify(sheet.cssRules);
                            if (val && val != "") {
                                if ($("." + cssClass).length == 0) {
                                    sheet.insertRule('.' + cssClass + ':before{content:"\\' + val + '"}', sheet.cssRules.length);
                                }

                                option.setAttribute("data-icon", 'fa ' + cssClass);
                            }
                        }

                    }
                }

                $(".selectpicker").selectpicker({
                    style: 'btn-default',
                    size: 10,
                });
            }
        }

        renderFormGlobal = renderForm;

        function buttonAdd(prefix, tableDiv, formData) {
            document.getElementById("add" + prefix).style.display = "block";
            $("#add" + prefix ).unbind();
            $("#add" + prefix ).on("click", function(e) {
                renderForm(prefix, tableDiv, formData.schema, formData.schemaUI, null);
            });
        }

        function loadTiles(item) {
            $.ajax({
                type: "GET",
                url: vUrl + "conf/" + item + "/form/",
                data: {
                    u: username,
                    p: password
                }
            }).done(function(data) {
                formData = data;
                adminFormSchemaList[item] = formData.schema;
                adminFormSchemaUIList[item] = formData.schemaUI;
                var divTable = document.getElementById(item + "table");
                if (formData.data instanceof Array)  {
                    buttonAdd(item, divTable, formData);
                    drawSquareInterface(formData, item, divTable, item + "-set", item + "-del", item + "-set", item + "-del");
                } else {
                    renderForm(item, divTable, formData.schema, formData.schemaUI, formData.data);
                }
            }).fail(function(msg) {
                setError(msg);
            });
        }

        loadTiles(item);
    }

    adminForm("devices");
    $("#manageDevicesItem").click(function(e) {
        adminForm("devices");
    });
    adminForm("users");
    $("#manageUsersItem").click(function(e) {
        adminForm("users");
    });
    adminForm("scenarios");
    $("#manageActionsItem").click(function(e) {
        adminForm("scenarios");
    });
    adminForm("alarm");
    $("#manageAlarmItem").click(function(e) {
        adminForm("alarm");
    });
}
