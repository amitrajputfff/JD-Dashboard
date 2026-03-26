import * as React from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { isValidPhoneNumber, getCountries } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Helper function to get country name from country code
const getCountryName = (countryCode: RPNInput.Country): string => {
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'IN': 'India',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'BR': 'Brazil',
    'JP': 'Japan',
    'CN': 'China',
    'RU': 'Russia',
    'MX': 'Mexico',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'BE': 'Belgium',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'GR': 'Greece',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'SI': 'Slovenia',
    'SK': 'Slovakia',
    'LT': 'Lithuania',
    'LV': 'Latvia',
    'EE': 'Estonia',
    'LU': 'Luxembourg',
    'MT': 'Malta',
    'CY': 'Cyprus',
    'IS': 'Iceland',
    'LI': 'Liechtenstein',
    'MC': 'Monaco',
    'SM': 'San Marino',
    'VA': 'Vatican City',
    'AD': 'Andorra',
    'TR': 'Turkey',
    'IL': 'Israel',
    'SA': 'Saudi Arabia',
    'AE': 'United Arab Emirates',
    'EG': 'Egypt',
    'ZA': 'South Africa',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'GH': 'Ghana',
    'MA': 'Morocco',
    'TN': 'Tunisia',
    'DZ': 'Algeria',
    'LY': 'Libya',
    'SD': 'Sudan',
    'ET': 'Ethiopia',
    'UG': 'Uganda',
    'TZ': 'Tanzania',
    'ZW': 'Zimbabwe',
    'BW': 'Botswana',
    'NA': 'Namibia',
    'ZM': 'Zambia',
    'MW': 'Malawi',
    'MZ': 'Mozambique',
    'MG': 'Madagascar',
    'MU': 'Mauritius',
    'SC': 'Seychelles',
    'KM': 'Comoros',
    'DJ': 'Djibouti',
    'SO': 'Somalia',
    'ER': 'Eritrea',
    'SS': 'South Sudan',
    'CF': 'Central African Republic',
    'TD': 'Chad',
    'NE': 'Niger',
    'ML': 'Mali',
    'BF': 'Burkina Faso',
    'CI': 'Ivory Coast',
    'LR': 'Liberia',
    'SL': 'Sierra Leone',
    'GN': 'Guinea',
    'GW': 'Guinea-Bissau',
    'GM': 'Gambia',
    'SN': 'Senegal',
    'MR': 'Mauritania',
    'CV': 'Cape Verde',
    'ST': 'São Tomé and Príncipe',
    'GQ': 'Equatorial Guinea',
    'GA': 'Gabon',
    'CG': 'Republic of the Congo',
    'CD': 'Democratic Republic of the Congo',
    'AO': 'Angola',
    'BI': 'Burundi',
    'RW': 'Rwanda',
    'LS': 'Lesotho',
    'SZ': 'Eswatini',
    'RE': 'Réunion',
    'YT': 'Mayotte',
    'SH': 'Saint Helena',
    'FK': 'Falkland Islands',
    'GS': 'South Georgia and the South Sandwich Islands',
    'TF': 'French Southern Territories',
    'HM': 'Heard Island and McDonald Islands',
    'AQ': 'Antarctica',
    'BV': 'Bouvet Island',
    'IO': 'British Indian Ocean Territory',
    'CX': 'Christmas Island',
    'CC': 'Cocos Islands',
    'NF': 'Norfolk Island',
    'AS': 'American Samoa',
    'CK': 'Cook Islands',
    'FJ': 'Fiji',
    'PF': 'French Polynesia',
    'GU': 'Guam',
    'KI': 'Kiribati',
    'MH': 'Marshall Islands',
    'FM': 'Micronesia',
    'NR': 'Nauru',
    'NC': 'New Caledonia',
    'NZ': 'New Zealand',
    'NU': 'Niue',
    'MP': 'Northern Mariana Islands',
    'PW': 'Palau',
    'PG': 'Papua New Guinea',
    'PN': 'Pitcairn Islands',
    'WS': 'Samoa',
    'SB': 'Solomon Islands',
    'TK': 'Tokelau',
    'TO': 'Tonga',
    'TV': 'Tuvalu',
    'VU': 'Vanuatu',
    'WF': 'Wallis and Futuna',
    'AR': 'Argentina',
    'BO': 'Bolivia',
    'CL': 'Chile',
    'CO': 'Colombia',
    'CR': 'Costa Rica',
    'CU': 'Cuba',
    'DO': 'Dominican Republic',
    'EC': 'Ecuador',
    'SV': 'El Salvador',
    'GT': 'Guatemala',
    'HN': 'Honduras',
    'JM': 'Jamaica',
    'NI': 'Nicaragua',
    'PA': 'Panama',
    'PY': 'Paraguay',
    'PE': 'Peru',
    'UY': 'Uruguay',
    'VE': 'Venezuela',
    'BZ': 'Belize',
    'GY': 'Guyana',
    'SR': 'Suriname',
    'TT': 'Trinidad and Tobago',
    'BB': 'Barbados',
    'AG': 'Antigua and Barbuda',
    'BS': 'Bahamas',
    'DM': 'Dominica',
    'GD': 'Grenada',
    'KN': 'Saint Kitts and Nevis',
    'LC': 'Saint Lucia',
    'VC': 'Saint Vincent and the Grenadines',
    'AI': 'Anguilla',
    'BM': 'Bermuda',
    'VG': 'British Virgin Islands',
    'KY': 'Cayman Islands',
    'GI': 'Gibraltar',
    'MS': 'Montserrat',
    'TC': 'Turks and Caicos Islands',
    'VI': 'U.S. Virgin Islands',
    'AW': 'Aruba',
    'CW': 'Curaçao',
    'SX': 'Sint Maarten',
    'BQ': 'Caribbean Netherlands',
    'GL': 'Greenland',
    'PM': 'Saint Pierre and Miquelon',
    'BL': 'Saint Barthélemy',
    'MF': 'Saint Martin',
    'GP': 'Guadeloupe',
    'MQ': 'Martinique',
    'GF': 'French Guiana',
    'AF': 'Afghanistan',
    'BD': 'Bangladesh',
    'BT': 'Bhutan',
    'BN': 'Brunei',
    'KH': 'Cambodia',
    'LK': 'Sri Lanka',
    'ID': 'Indonesia',
    'IR': 'Iran',
    'IQ': 'Iraq',
    'JO': 'Jordan',
    'KZ': 'Kazakhstan',
    'KW': 'Kuwait',
    'KG': 'Kyrgyzstan',
    'LA': 'Laos',
    'LB': 'Lebanon',
    'MY': 'Malaysia',
    'MV': 'Maldives',
    'MN': 'Mongolia',
    'MM': 'Myanmar',
    'NP': 'Nepal',
    'KP': 'North Korea',
    'OM': 'Oman',
    'PK': 'Pakistan',
    'PS': 'Palestine',
    'PH': 'Philippines',
    'QA': 'Qatar',
    'SG': 'Singapore',
    'KR': 'South Korea',
    'SY': 'Syria',
    'TW': 'Taiwan',
    'TJ': 'Tajikistan',
    'TH': 'Thailand',
    'TL': 'East Timor',
    'TM': 'Turkmenistan',
    'UZ': 'Uzbekistan',
    'VN': 'Vietnam',
    'YE': 'Yemen',
    'BH': 'Bahrain',
    'GE': 'Georgia',
    'AM': 'Armenia',
    'AZ': 'Azerbaijan',
    'MD': 'Moldova',
    'UA': 'Ukraine',
    'BY': 'Belarus',
    'RS': 'Serbia',
    'ME': 'Montenegro',
    'BA': 'Bosnia and Herzegovina',
    'MK': 'North Macedonia',
    'AL': 'Albania',
    'XK': 'Kosovo'
  };
  
  return countryNames[countryCode] || countryCode;
};

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
    showValidation?: boolean;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, value, showValidation = true, ...props }, ref) => {
      const [isValid, setIsValid] = React.useState(true);
      const [currentCountry, setCurrentCountry] = React.useState<RPNInput.Country>("IN");
      
      // Clean the initial value to remove any extra text
      const cleanValue = React.useMemo(() => {
        if (!value || value === "") return undefined;
        const cleaned = value.toString().replace(/[^\d+]/g, '');
        // Don't return just the country code, return undefined if it's empty after cleaning
        return (cleaned && cleaned.length > 0) ? cleaned as RPNInput.Value : undefined;
      }, [value]);

      const handleChange = (phoneValue: RPNInput.Value | undefined) => {
        // Clean the value to ensure it's only a phone number
        const cleanValue = phoneValue ? phoneValue.toString().replace(/[^\d+]/g, '') : "";
        const coercedValue = cleanValue as RPNInput.Value;
        onChange?.(coercedValue);

        // Validate phone number if validation is enabled
        if (showValidation && coercedValue) {
          const valid = isValidPhoneNumber(coercedValue, currentCountry);
          setIsValid(valid);
        } else {
          setIsValid(true);
        }
      };

      const handleCountryChange = (country: RPNInput.Country) => {
        setCurrentCountry(country);
        // Re-validate when country changes
        if (showValidation && cleanValue) {
          const valid = isValidPhoneNumber(cleanValue, country);
          setIsValid(valid);
        }
      };

      return (
        <div className="flex flex-col">
          <RPNInput.default
            ref={ref}
            className={cn("flex", className)}
            flagComponent={FlagComponent}
            countrySelectComponent={(countrySelectProps) => (
              <CountrySelect {...countrySelectProps} onCountryChange={handleCountryChange} />
            )}
            inputComponent={InputComponent}
            smartCaret={false}
            defaultCountry="IN"
            value={cleanValue}
            onChange={handleChange}
            {...props}
          />
          {showValidation && !isValid && cleanValue && (
            <p className="text-sm text-red-500 mt-1">
              Invalid phone number format for {currentCountry ? getCountryName(currentCountry) : 'selected country'}
            </p>
          )}
        </div>
      );
    },
  );
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    className={cn("rounded-e-lg rounded-s-none px-5 py-3", className)}
    {...props}
    ref={ref}
    type="tel"
    inputMode="tel"
  />
));
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
  onCountryChange?: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
  onCountryChange,
}: CountrySelectProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  // Use default country if selectedCountry is undefined
  const displayCountry = selectedCountry || "IN";

  return (
    <Popover
      open={isOpen}
      modal
      onOpenChange={(open) => {
        setIsOpen(open);
        open && setSearchValue("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-3 rounded-e-none rounded-s-lg border-r-0 px-5 py-3 focus:z-10 min-w-[140px]"
          disabled={disabled}
        >
          <FlagComponent
            country={displayCountry}
            countryName={displayCountry}
          />
          <span className="text-xs font-mono">+{RPNInput.getCountryCallingCode(displayCountry)}</span>
          <ChevronsUpDown
            className={cn(
              "ml-auto size-4 opacity-50",
              disabled ? "hidden" : "opacity-100",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0">
        <Command className="[&_[cmdk-item]]:opacity-100 [&_[cmdk-item]]:text-foreground [&_[cmdk-item]]:cursor-pointer">
          <CommandInput
            value={searchValue}
            onValueChange={(value) => {
              setSearchValue(value);
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector(
                    "[data-radix-scroll-area-viewport]",
                  );
                  if (viewportElement) {
                    viewportElement.scrollTop = 0;
                  }
                }
              }, 0);
            }}
            placeholder="Search country..."
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={displayCountry}
                      onChange={(country) => {
                        onChange(country);
                        onCountryChange?.(country);
                        setIsOpen(false);
                      }}
                    />
                  ) : null,
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    onChange(country);
  };

  return (
    <CommandItem 
      className="gap-4 cursor-pointer opacity-100 text-foreground hover:bg-accent px-4 py-3"
      style={{ opacity: 1, pointerEvents: 'auto', cursor: 'pointer' }}
      onSelect={handleSelect}
    >
      <FlagComponent country={country} countryName={countryName} />
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ opacity: 1 }}>{countryName}</div>
        <div className="text-xs font-mono text-muted-foreground">{`+${RPNInput.getCountryCallingCode(country)}`}</div>
      </div>
      <CheckIcon
        className={`ml-auto size-4 ${country === selectedCountry ? "opacity-100" : "opacity-0"}`}
      />
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
