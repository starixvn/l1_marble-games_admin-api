import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsArray, IsObject, IsString } from "class-validator";

export class MarketIntegrationUpdateRequestDto {
  @ApiProperty({
    description: 'Object id of the market integration object',
    required: false,
    example: "6809fce26a798f36657e4c4d",
    type: String
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Merge configuration object',
    required: false,
    example: { "marketType": "1x2", "priority": 1 },
    type: Object
  })
  @IsOptional()
  merge?: Record<string, any>;

  @ApiProperty({
    description: 'Selection array',
    required: false,
    example: [{ "selectionID": 1, "name": "ft_hdp_home", "column": 1 }, { "selectionID": 2, "name": "ft_hdp_away", "column": 2 }],
    type: Object,
    isArray: true
  })
  @IsOptional()
  selections?: Array<any>;

  @IsOptional()
  @IsString()
  name?: string;
}

export class GameIntegrationUpdateRequestDto {
  @ApiProperty({ 
    description: 'Merge event configuration object',
    required: false,
    example: {
      "productCode": "SM_CLUB_WC_25",
      "productTypeKey": "MARBLE",
      "_id": null,
      "__v": null,
      "streamServer": "$STREAM_SERVER",
      "videoExtension": "mp4"
    }
  })
  @IsOptional()
  @IsObject()
  mergeEvent?: Record<string, any>;

  @ApiProperty({ 
    description: 'Array of merge event details',
    required: false,
    example: [],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  mergeEventDetails?: Array<any>;

  @ApiProperty({ 
    description: 'Array of patches to apply',
    required: false,
    example: [
    {
      "op": "jsonata",
      "path": "/eventDetails/0/playlist",
      "expression": "$exists(eventDetails[0].playlist) and $trim(eventDetails[0].playlist) != \"\" ? streamServer & '/' & eventDetails[0].playlist & '.' & videoExtension : \"\""
    },
    {
      "op": "jsonata",
      "path": "/eventDetails/0/goalInfo",
      "expression": "$exists(eventDetails[0].goalInfo) and $trim(eventDetails[0].goalInfo) != \"\" ? streamServer & '/' & eventDetails[0].goalInfo & '.json' : \"\""
    },
    {
      "op": "jsonata",
      "path": "/eventDetails/1/playlist",
      "expression": "$exists(eventDetails[1].playlist) and $trim(eventDetails[1].playlist) != \"\" ? streamServer & '/' & eventDetails[1].playlist & '.' & videoExtension : \"\""
    },
    {
      "op": "jsonata",
      "path": "/eventDetails/1/goalInfo",
      "expression": "$exists(eventDetails[1].goalInfo) and $trim(eventDetails[1].goalInfo) != \"\" ? streamServer & '/' & eventDetails[1].goalInfo & '.json' : \"\""
    },
    {
      "op": "remove",
      "path": "/streamServer"
    },
    {
      "op": "remove",
      "path": "/videoExtension"
    },
    {
      "op": "remove",
      "path": "/eventDetails/0/selections"
    },
    {
      "op": "remove",
      "path": "/eventDetails/1/selections"
    },
    {
      "op": "remove",
      "path": "/gameId"
    },
    {
      "op": "jsonata",
      "path": "/eventDetails/0/result",
      "expression": "$exists(eventDetails[0].result) and $exists(eventDetails[0].result.finalScore) ? eventDetails[0].result.finalScore : \"\""
    },
    {
      "op": "jsonata",
      "path": "/eventDetails/1/result",
      "expression": "$exists(eventDetails[1].result) and $exists(eventDetails[1].result.finalScore) ? eventDetails[1].result.finalScore : \"\""
    }
  ],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  patches?: Array<Record<string, any>>;

  @ApiProperty({ 
    description: 'Array of market integration objects',
    required: false,
    isArray: true,
    type: MarketIntegrationUpdateRequestDto,
    example: [
      {
        "merge": {
          "marketID": 1,
          "marketNameKey": "MARKET_HANDICAP",
          "marketName": "Handicap"
        },
        "selections": [
          {
            "selectionID": 1,
            "column": 1,
            "selectionOrder": 1,
            "selectionNameLongKey": "HOME_WIN",
            "name": "ft_hdp_home"
          },
          {
            "selectionID": 2,
            "column": 2,
            "selectionOrder": 1,
            "selectionNameLongKey": "AWAY_WIN",
            "name": "ft_hdp_away"
          }
        ]
      },{
        "merge": {
          "marketID": 2,
          "marketNameKey": "MARKET_1H_HANDICAP",
          "marketName": "1H Handicap"
        },
        "selections": [
          {
            "selectionID": 3,
            "column": 1,
            "selectionOrder": 1,
            "selectionNameLongKey": "HOME_WIN",
            "name": "h1_hdp_home"
          },
          {
            "selectionID": 4,
            "column": 2,
            "selectionOrder": 1,
            "selectionNameLongKey": "AWAY_WIN",
            "name": "h1_hdp_away"
          }
        ]
      },{
        "merge": {
          "marketID": 3,
          "marketNameKey": "MARKET_OVER_UNDER",
          "marketName": "Over/Under"
        },
        "selections": [
          {
            "selectionID": 5,
            "column": 1,
            "selectionOrder": 1,
            "selectionNameLongKey": "OVER",
            "name": "ft_ou_over"
          },
          {
            "selectionID": 6,
            "column": 2,
            "selectionOrder": 1,
            "selectionNameLongKey": "UNDER",
            "name": "ft_ou_under"
          }
        ]
      },{
        "merge": {
          "marketID": 4,
          "marketNameKey": "MARKET_1H_OVER_UNDER",
          "marketName": "1H Over/Under"
        },
        "selections": [
          {
            "selectionID": 7,
            "column": 1,
            "selectionOrder": 1,
            "selectionNameLongKey": "OVER",
            "name": "h1_ou_over"
          },
          {
            "selectionID": 8,
            "column": 2,
            "selectionOrder": 1,
            "selectionNameLongKey": "UNDER",
            "name": "h1_ou_under"
          }
        ]
      },
      {
       "merge": {
          "marketID": 5,
          "marketNameKey": "MARKET_EVEN_ODD",
          "marketName": "Odd/Even"
        },
        "selections": [
          {
            "selectionID": 9,
            "column": 1,
            "selectionOrder": 1,
            "selectionNameLongKey": "EVEN",
            "name": "ft_oe_even"
          },
          {
            "selectionID": 10,
            "column": 2,
            "selectionOrder": 1,
            "selectionNameLongKey": "ODD",
            "name": "ft_oe_odd"
          }
        ] 
      },
      {
        "merge": {
          "marketID": 6,
          "marketNameKey": "MARKET_1H_EVEN_ODD",
          "marketName": "1H Odd/Even"
        },
        "selections": [
          {
            "selectionID": 11,
            "column": 1,
            "selectionOrder": 1,
            "selectionNameLongKey": "EVEN",
            "name": "h1_oe_even"
          },
          {
            "selectionID": 12,
            "column": 2,
            "selectionOrder": 1,
            "selectionNameLongKey": "ODD",
            "name": "h1_oe_odd"
          }
        ]
      },
      {
        "merge": {
          "marketID": 7,
          "marketNameKey": "MARKET_1X2",
          "marketName": "1X2"
        },
        "selections": [
          {
            "selectionID": 13,
            "column": 1,
            "selectionOrder": 1,
            "selectionNameLongKey": "HOME",
            "name": "ft_1x2_home"
          },
          {
            "selectionID": 14,
            "column": 2,
            "selectionOrder": 1,
            "selectionNameLongKey": "AWAY",
            "name": "ft_1x2_away"
          },
          {
            "selectionID": 15,
            "column": 3,
            "selectionOrder": 1,
            "selectionNameLongKey": "TIE",
            "name": "ft_1x2_draw"
          }
        ]
      },
      {
        "merge": {
          "marketID": 8,
          "marketNameKey": "MARKET_1H_1X2",
          "marketName": "1H 1X2"
        },
        "selections": [
          {
            "selectionID": 16,
            "column": 1,
            "selectionOrder": 1,
            "selectionNameLongKey": "HOME",
            "name": "h1_1x2_home"
          },
          {
            "selectionID": 17,
            "column": 2,
            "selectionOrder": 1,
            "selectionNameLongKey": "AWAY",
            "name": "h1_1x2_away"
          },
          {
            "selectionID": 18,
            "column": 3,
            "selectionOrder": 1,
            "selectionNameLongKey": "TIE",
            "name": "h1_1x2_draw"
          }
        ]
      }
    ]
  })
  @IsOptional()
  @IsArray()
  markets?: Array<MarketIntegrationUpdateRequestDto>;
}
