<?php 

// Server in the this format: <computer>\<instance name> or 
// <server>,<port> when using a non default port number
$server = 'INTERNPROG';
$connectionInfo = array( "Database"=>"NCCD_OPENDATACACHE_DOH_DATA", "UID"=>"Reader", "PWD"=>"password");

// Connect to MSSQL
$link = sqlsrv_connect($server, $connectionInfo);

if( $link ) {
     //echo "Connection established.<br />";
}else{
     echo "Connection could not be established.<br />";
     die( print_r( sqlsrv_errors(), true));
}
if (!isset($_GET["value"])) {
	$value = "Data_Value";
} else {
	$value = $_GET["value"];
}

if (!isset($_GET["unit"])) {
	$unit = "Data_Value_Unit";
} else {
	$unit = $_GET["unit"];
}

if (!isset($_GET["label"])) {
	$label = "Year";
} else {
	$label = $_GET["label"];
}

if (!isset($_GET["table"])) {
	$table = "DOH_Data_Fluoridation";
} else {
	$table = $_GET["table"];
}

if (!isset($_GET["field"])) {
	$field = "Indicator";
} else {
	$field = $_GET["field"];
}

if (!isset($_GET["sign"])) {
	$sign = "=";
} else {
	$sign = $_GET["sign"];
}

if (!isset($_GET["val"])) {
	$val = "Percent of population served by CWS that are receiving fluoridated water";
} else {
	$val = $_GET["val"];
}

if (!isset($_GET["field2"])) {
	$field2 = "LocationDesc";
} else {
	$field2 = $_GET["field2"];
}

if (!isset($_GET["sign2"])) {
	$sign2 = "=";
} else {
	$sign2 = $_GET["sign2"];
}

if (!isset($_GET["val2"])) {
	$val2 = "Alaska";
} else {
	$val2 = $_GET["val2"];
}

if (!isset($_GET["order"])) {
	$order = "Year";
} else {
	$order = $_GET["order"];
}


$query = "SELECT ".$value." AS Value, ".$unit." AS Unit, ".$label." AS Label FROM ".$table." WHERE ";

$i = 0;
while (isset($_GET["field".$i])) {
	$query = $query.$_GET["field".$i].$_GET["sign".$i]."'".$_GET["val".$i]."'";
	$i++;
	if (isset($_GET["field".$i])) $query = $query." AND ";
}

$query = $query." ORDER BY ".$order." ASC";

$stmt = sqlsrv_query($link, $query);
if( $stmt === false) {
   die( print_r( sqlsrv_errors(), true));
}



$numFields = sqlsrv_num_fields( $stmt );
echo '[';
$row = sqlsrv_fetch_array( $stmt );
while( $row ) {

   echo '{ "label": '.$row["Label"].', "value":'.$row["Value"].' }';

   $row = sqlsrv_fetch_array( $stmt );
   if ($row) {
	   echo ",";
   }
}
echo ']';

?>