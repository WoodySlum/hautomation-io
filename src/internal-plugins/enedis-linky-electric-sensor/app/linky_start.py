#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generates energy consumption graphs from Enedis (ERDF) consumption data
collected via their infrastructure.
"""

# Linkindle - Linky energy consumption curves on a Kindle display.
# Copyright (C) 2016 Baptiste Candellier
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import os
import datetime
import argparse
import logging
import sys
import locale
from dateutil.relativedelta import relativedelta
import json

import linky


def dtostr(date):
    return date.strftime("%d/%m/%Y")


def main():
    logging.basicConfig(format='%(asctime)s %(message)s', level=logging.INFO)

    #try:
    #    locale.setlocale(locale.LC_ALL, 'fr_FR.utf8')
    #except locale.Error as exc:
        #logging.error(exc)

    parser = argparse.ArgumentParser()
    parser.add_argument("-username", "--username", type=str, default="",
                        help="Enedis username")
    parser.add_argument("-password", "--password", type=str, default="",
                        help="Enedis password")
    parser.add_argument("-startDate", "--startDate", type=str, default=dtostr(datetime.date.today() - relativedelta(days=1)),
                        help="Start date")
    parser.add_argument("-endDate", "--endDate", type=str, default=dtostr(datetime.date.today()),
                        help="End date")

    args = parser.parse_args()

    try:
        token = linky.login(args.username, args.password)
        today = datetime.date.today()
        res_hour = linky.get_data_per_hour(token, args.startDate, args.endDate)


        print(json.dumps(res_hour))


    except linky.LinkyLoginException as exc:
        logging.error(exc)
        sys.exit(1)

    except linky.LinkyServiceException as exc:
        logging.error(exc)
        sys.exit(1)


if __name__ == "__main__":
    main()
