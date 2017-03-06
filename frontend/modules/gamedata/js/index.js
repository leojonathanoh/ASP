;(function( $, window, document, undefined ) {

    $(document).ready(function() {

        // Define globals
        var currentAction = '';
        var currentId = '';
        var currentType = '';

        // Ajax and form Validation
        //noinspection JSJQueryEfficiency
        var validator = $("#mws-validate").validate({
            rules: {
                itemName: {
                    required: true,
                    minlength: 3,
                    maxlength: 32
                }
            },
            invalidHandler: function (form, validator) {
                var errors = validator.numberOfInvalids();
                if (errors) {
                    var message = errors == 1 ? 'You missed 1 field. It has been highlighted' : 'You missed ' + errors + ' fields. They have been highlighted';
                    $("#mws-validate-error").html(message).show();
                } else {
                    $("#mws-validate-error").hide();
                }
            }
        });

        // Modal forms
        //noinspection JSUnresolvedVariable
        if( $.fn.dialog ) {
            $("#editor-form").dialog({
                autoOpen: false,
                title: "Edit Name",
                modal: true,
                width: "640",
                resizable: false,
                buttons: [{
                    text: "Submit",
                    click: function () {
                        $(this).find('form#mws-validate').submit();
                    }
                }]
            });

            $("#mws-jui-dialog").dialog({
                autoOpen: false,
                title: "Confirm Delete",
                modal: true,
                width: "640",
                resizable: false
            });

            // Add New Click
            $("[id^=add-new-]").click(function(e) {

                // For all modern browsers, prevent default behavior of the click
                e.preventDefault();

                // Hide previous errors
                $("#mws-validate-error").hide();
                validator.resetForm();

                var sid = $(this).attr('id').split("-");
                currentType = sid[sid.length-1];
                currentId = 0;
                currentAction = "add";

                // Set hidden input value
                $('input[name="action"]').val('add');
                $('input[name="itemId"]').val(0);
                $('input[name="itemType"]').val(currentType);

                // Set form default values
                $('input[name="itemName"]').val("");

                // Uppercase name
                var nm = currentType.substring(0,1).toUpperCase() + currentType.substring(1, currentType.length);

                // Show dialog form
                $("#editor-form").dialog("option", {
                    modal: true,
                    title: "Create New " + nm + " Type"
                }).dialog("open");

                // Just to be sure, older IE's needs this
                return false;
            });
        }

        // Tooltips
        $.fn.tooltip && $('[rel="tooltip"]').tooltip({ "delay": { show: 500, hide: 0 } });

        // Row Button Clicks
        $(document).on('click', 'a.btn-small', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // Extract the server ID
            var sid = $(this).attr('id').split("-");
            if (sid.length != 3 || $(this).attr('disabled') == 'disabled')
                return false;

            // Parse sections into variables
            currentAction = sid[0];
            currentType = sid[1];
            currentId = sid[2];
            var tableRow = $(this).closest('tr');
            var name = tableRow.find('td:eq(1)').html();

            if (currentAction == 'delete') {
                // Show dialog form
                $("#mws-jui-dialog").dialog("option", {
                    modal: true,
                    buttons: [
                    {
                        text: "Confirm",
                        class: "btn btn-danger",
                        click: function () {

                            // Push the request
                            $.post( "/ASP/gamedata/delete", {
                                action: "delete",
                                itemType: currentType,
                                itemId: currentId
                            }).done(function( data ) {

                                // Parse response
                                var result = jQuery.parseJSON(data);
                                if (result.success == false) {
                                    $('#jui-message').attr('class', 'alert error').html(result.message).slideDown(500);
                                }
                                else {
                                    // Remove row
                                    tableRow.remove();
                                    disable_btns_for(currentType);
                                }
                            });

                            $(this).dialog("close");
                        }
                    },
                    {
                        text: "Cancel",
                        click: function () {
                            $(this).dialog("close");
                        }
                    }]
                }).dialog("open");
            }
            else {
                // Hide previous errors
                $("#mws-validate-error").hide();
                validator.resetForm();

                // Set hidden input value
                $('input[name="action"]').val('edit');
                $('input[name="itemId"]').val(currentId);
                $('input[name="itemType"]').val(currentType);

                // Set form default values
                $('input[name="itemName"]').val(name);

                // Uppercase name
                var nm = currentType.substring(0,1).toUpperCase() + currentType.substring(1, currentType.length);

                // Show dialog form
                $("#editor-form").dialog("option", {
                    modal: true,
                    title: "Edit Name"
                }).dialog("open");
            }

            // Just to be sure, older IE's needs this
            return false;
        });

        //noinspection JSJQueryEfficiency
        $("#mws-validate").ajaxForm({
            beforeSubmit: function (arr, data, options)
            {
                $("#mws-validate-error").hide();
                return true;
            },
            success: function (response, statusText, xhr, $form) {
                // Parse the JSON response
                var result = jQuery.parseJSON(response);
                if (result.success == true) {

                    // Reload the table
                    var markup = '<tr><td>' + result.itemId + '<td>' + result.itemName + '</td><td> \
                            <span class="btn-group"> \
                                <a id="edit-' + currentType + '-' + result.itemId + '" href="#"  rel="tooltip" title="Edit Name" class="btn btn-small"> \
                                    <i class="icon-pencil"></i>\
                                </a> \
                                <a id="delete-' + currentType + '-' + result.itemId + '" href="#" class="btn btn-small" rel="tooltip" title="Delete" >\
                                    <i class="icon-trash"></i>\
                                </a> \
                            </span> \
                            </td> \
                        </tr>';
                    $("table#" + currentType + " tbody").append(markup);

                    // Refresh buttons
                    disable_btns_for(currentType);

                    // Close dialog
                    $("#editor-form").dialog("close");
                }
                else {
                    $('#jui-message').attr('class', 'alert error').html(result.message).slideDown(500);
                }
            },
            error: function(request, status, error) {
                $('#jui-message').attr('class', 'alert error').html('AJAX Error! Please check the console log.').slideDown(500);
            },
            timeout: 5000
        });

        var items = ['army', 'kit', 'vehicle', 'weapon'];
        for (var i = 0; i < items.length; i++)
        {
            var item = items[i];
            disable_btns_for(item);
        }

    });

    function disable_btns_for(item) {
        var selector = $('table#' + item + ' > tbody > tr');
        selector.each(function(key, value) {
            $(value).find('td:last span a:last').attr('disabled', true);
        });
        selector.last().find('td:last span a:last').attr('disabled', false);
    }

}) (jQuery, window, document);