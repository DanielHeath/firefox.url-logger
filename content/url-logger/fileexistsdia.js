function onAccept()
{
    window.arguments[0].return = true;
    return true;
}

function onCancel()
{
    window.arguments[0].return = false;
    return true;
}
