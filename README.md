# jsonata-transform-component-oih [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> Dedicated data transformation component for Open Integration Hub platform based on JSONata

## Authentication

This component requires no authentication.

## How it works

This component takes the incoming message data and applies the configured JSONata tranformation on it. It uses
a fact that JSONata expression is a superset of JSON document so that by default any valid JSON document is
a valid JSONata expression.

For example let's take this sample incoming message data:

```json
{
  "Account": {
    "Account Name": "Firefly",
    "Order": [
      {
        "OrderID": "order103",
        "Product": [
          {
            "Product Name": "Bowler Hat",
            "ProductID": 858383,
            "SKU": "0406654608",
            "Description": {
              "Colour": "Purple",
              "Width": 300,
              "Height": 200,
              "Depth": 210,
              "Weight": 0.75
            },
            "Price": 34.45,
            "Quantity": 2
          },
          {
            "Product Name": "Trilby hat",
            "ProductID": 858236,
            "SKU": "0406634348",
            "Description": {
              "Colour": "Orange",
              "Width": 300,
              "Height": 200,
              "Depth": 210,
              "Weight": 0.6
            },
            "Price": 21.67,
            "Quantity": 1
          }
        ]
      }
    ]
  }
}
```

You can use following JSONata expressions to transform it:

```jsonata
{
	"account": Account."Account Name",
	"orderCount" : $count(Account.Order)
}
```

result of that transofrmation will be the following JSON document ([jsonata link](http://try.jsonata.org/B1ctn36ub)):

```json
{
  "account": "Firefly",
  "orderCount": 1
}
```

I hope you've got the idea. Now you can also do something more complicated, like this array-to-array transformation:

```jsonata
{
    "account": Account."Account Name",
    "products": Account.Order.Product.({
    	"name": $."Product Name",
        "revenue": (Price * Quantity)
    }),
    "orderIDs": Account.Order[].(OrderID)
}
```

resulting in ([jsonata link](http://try.jsonata.org/B1ctn36ub)):

```json
{
  "account": "Firefly",
  "products": [
    {
      "name": "Bowler Hat",
      "revenue": 68.9
    },
    {
      "name": "Trilby hat",
      "revenue": 21.67
    }
  ],
  "orderIDs": [
    "order103"
  ]
}
```

## Extended Functions

Setting the configuration field `extendedFunctions` to `true` provides additional functions that can be used within your JSONata transformation.

### ISO2 Country Code to ISO3 Country Code

The `$iso2to3` function accepts a 2 digit ISO Code and returns the 3 digit ISO code.

For example, take the following JSON object and JSONata expression.

```json
{
  "ISO2": "CA"
}
```

```json
{
  "ISO3": $iso2to3(ISO2)
}
```

The JSONata expression will result in

```json
{
  "ISO3": "CAN"
}
```


### Phone Country Code to ISO3 Country Code

The `$phoneCodeToIso3` function accepts a phone country code (i.e., 1 for USA, 44 for United Kingdom) and returns the 3 digit ISO code.

For example, take the following JSON object and JSONata expression.

```json
{
  "phoneCode": "44"
}
```

```json
{
  "ISO3": $phoneCodeToIso3(phoneCode)
}
```

The JSONata expression will result in

```json
{
  "ISO3": "GBR"
}
```
